import dataclasses
import logging
import random
import threading
import uuid
from typing import Optional, List

from app.game.coordinates import Coordinates
from app.game.events import Event, EventType
from app.game.exceptions import (
    PlayerLimitExceeded,
    PlayerNotFound,
    PlayerAlreadyConnected,
    PlayerInvalidNickname,
    ChangingPastPosition,
    ChangingFuturePosition,
)
from app.game.models import PlayerPositionUpdateRequest
from app.tools.encoder import encode
from app.tools.timestamp import timestamp_now
from app.tools.websocket_server import WebSocketSession


logging.getLogger().setLevel(logging.INFO)


class PlayerPosition:
    coordinates: Coordinates
    bearing: int
    velocity: int
    timestamp: int

    def __init__(
        self,
        coordinates: Coordinates,
        bearing: int,
        velocity: int,
        timestamp: int,
    ):
        self.coordinates = coordinates
        self.bearing = bearing
        self.velocity = velocity
        self.timestamp = timestamp

    def future_position(self, timestamp_delta: int) -> "PlayerPosition":
        distance_traveled = self.velocity * timestamp_delta // 3600000
        future_coordinates = self.coordinates.destination_coordinates(distance=distance_traveled, bearing=self.bearing)
        return PlayerPosition(
            coordinates=future_coordinates,
            bearing=self.bearing,
            velocity=self.velocity,
            timestamp=self.timestamp + timestamp_delta,
        )

    @staticmethod
    def random() -> "PlayerPosition":
        return PlayerPosition(
            coordinates=Coordinates(random.uniform(-180, 180), random.uniform(-180, 180)),
            bearing=random.randint(0, 359),
            velocity=0,
            timestamp=timestamp_now(),
        )

    @property
    def serialized(self) -> dict:
        return {
            "lat": self.coordinates.latitude,
            "lon": self.coordinates.longitude,
            "velocity": self.velocity,
            "bearing": self.bearing,
            "timestamp": self.timestamp,
        }


class Player:

    def __init__(self, nickname: str):
        self._id: uuid.UUID = uuid.uuid4()
        self._nickname: str = nickname
        self._token: str = uuid.uuid4().hex
        self.disconnected_since: int = timestamp_now()
        self.session_id: Optional[uuid.UUID] = None
        self.position: PlayerPosition = PlayerPosition.random()

    @property
    def id(self) -> uuid.UUID:
        return self._id

    @property
    def nickname(self) -> str:
        return self._nickname

    @property
    def token(self) -> str:
        return self._token

    @property
    def is_connected(self) -> bool:
        return bool(self.session_id)

    @property
    def serialized(self) -> dict:
        return {
            "id": self.id,
            "nickname": self.nickname,
            "connected": self.is_connected,
            "position": self.position.serialized,
        }


class GameSession:
    MAX_PLAYERS = 10
    PLAYER_TIME_TO_CONNECT = 30000  # 30 seconds

    def __init__(self):
        self._players = {}
        self._sessions = {}
        t = threading.Thread(target=self.run_frontman)
        t.start()

    def run_frontman(self):
        """
        Manages the whole game runtime
        """
        while True:
            logging.debug("FRONTMAN | loop")
            self.remove_idle_players()

    def send_event(self, event: Event, player: Player):
        logging.info("send_event %s", event.type)
        session, _ = self._sessions.get(player.session_id)
        data = dataclasses.asdict(event)
        data = encode(data)
        session.send(data)

    def broadcast_event(self, event: Event, everyone_except: List[Player] = None):
        logging.info("broadcast_event %s", event.type)
        excl_player_ids = [p.id for p in everyone_except or []]
        sessions: List[WebSocketSession] = [s for s, _ in self._sessions.values() if s.player_id not in excl_player_ids]
        logging.info("broadcast will be to sessions %s", str([s.id for s in sessions]))
        for session in sessions:
            data = dataclasses.asdict(event)
            data = encode(data)
            session.send(data)

    def get_player(self, player_id: uuid.UUID) -> Player:
        player = self._players.get(player_id)
        if not player:
            raise PlayerNotFound
        return player

    def player_list(self) -> List[dict]:
        return [p.serialized for p in self._players.values()]

    def remove_idle_players(self):
        logging.debug(f"remove_idle_players")
        now = timestamp_now()

        for player in list(self._players.values()):
            if player.is_connected:
                continue
            if now - player.disconnected_since > self.PLAYER_TIME_TO_CONNECT:
                self.remove_player(player)

    def get_player_by_token(self, token: str) -> Player:
        for player in self._players.values():
            if player.token == token:
                return player
        raise PlayerNotFound

    def get_players_session(self, player_id: uuid.UUID) -> WebSocketSession:
        player = self.get_player(player_id=player_id)
        ws_session, _ = self._sessions.get(player.session_id, (None, None))
        if not ws_session:
            raise PlayerNotFound
        return ws_session

    def add_player(self, nickname: str) -> Player:
        logging.info(f"add_player {nickname}")
        if len(self._players) >= self.MAX_PLAYERS:
            raise PlayerLimitExceeded
        for player in self._players.values():
            if player.nickname.lower().strip() == nickname.lower().strip():
                raise PlayerInvalidNickname
        player = Player(nickname=nickname)
        self._players[player.id] = player
        event = Event(type=EventType.PLAYER_REGISTERED, data=player.serialized)
        self.broadcast_event(event=event, everyone_except=[player])
        logging.info(f"add_player {nickname} added {player.id}")
        return player

    def add_session(self, player: Player, ws_session: WebSocketSession):
        logging.info(f"add_session {ws_session.id} for player {player.id}")
        if player.is_connected:
            raise PlayerAlreadyConnected
        self._sessions[ws_session.id] = (ws_session, player)
        player.session_id = ws_session.id
        event = Event(type=EventType.PLAYER_CONNECTED, data=player.serialized)
        self.broadcast_event(event=event, everyone_except=[player])

    def remove_session(self, ws_session: WebSocketSession):
        logging.info(f"remove_session {ws_session.id}")
        ws_session.close_connection()
        self._sessions.pop(ws_session.id, None)
        player = self.get_player(player_id=ws_session.player_id)
        player.session_id = None
        player.disconnected_since = timestamp_now()
        event = Event(type=EventType.PLAYER_DISCONNECTED, data=player.serialized)
        self.broadcast_event(event=event, everyone_except=[player])

    def remove_player(self, player: Player):
        logging.info(f"remove_player {player.id}")
        try:
            ws_session = self.get_players_session(player.id)
            self.remove_session(ws_session)
        except PlayerNotFound:
            pass
        try:
            self._players.pop(player.id)
            event = Event(type=EventType.PLAYER_REMOVED, data=player.serialized)
            self.broadcast_event(event=event, everyone_except=[player])
        except KeyError:
            pass

    def update_player_position(self, player: Player, timestamp: int, velocity: int, bearing: int):
        logging.info(f"update_player_position {player.id} timestamp: {timestamp} V={velocity} bearing={bearing}")
        last_position = player.position
        MAX_FUTURE_TIME_DEVIATION = 500  # event can be at most 500ms in the future

        if last_position.timestamp >= timestamp:
            # ignore, we can't change the past
            logging.warning(
                f"update_player_position position not updated, timestamp %s older than %s",
                timestamp,
                last_position.timestamp,
            )
            raise ChangingPastPosition
        now = timestamp_now()
        if timestamp > now + MAX_FUTURE_TIME_DEVIATION:
            logging.warning(f"update_player_position position not updated, timestamp %s newer than %s", timestamp, now)
            raise ChangingFuturePosition

        new_position = last_position.future_position(timestamp_delta=timestamp-last_position.timestamp)
        new_position.velocity = velocity  # todo validation
        new_position.bearing = bearing  # todo validation

        player.position = new_position
        event = Event(type=EventType.PLAYER_POSITION_UPDATED, data={
            "id": player.id,
            "position": new_position.serialized,
        })
        self.broadcast_event(event=event, everyone_except=[player])

    def handle_player_position_update_request_event(self, player: Player, event: Event):
        logging.info(f"handle_player_position_update_request_event {player.id} {event}")
        data_model = PlayerPositionUpdateRequest(**event.data)
        self.update_player_position(
            player=player,
            timestamp=data_model.timestamp,
            bearing=data_model.bearing,
            velocity=data_model.velocity,
        )

    def handle_event_sync(self, player: Player, event: Event):
        logging.info(f"handle_event_sync {player.id} {event}")
        event = Event(type=EventType.CLOCK_TIME, data={
            "timestamp": timestamp_now(),
        })
        self.send_event(event=event, player=player)

    def handle_event(self, player: Player, event: Event):
        logging.info(f"handle_event {player.id} {event}")

        if event.type == EventType.PLAYER_POSITION_UPDATE_REQUEST:
            self.handle_player_position_update_request_event(player=player, event=event)
            return

        if event.type == EventType.CLOCK_SYNC:
            self.handle_event_sync(player=player, event=event)
