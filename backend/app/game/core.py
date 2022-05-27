import dataclasses
import logging
import random
import threading
import time
import uuid
from typing import Optional, List

from app.game.consts import AIRPORTS
from app.game.coordinates import Coordinates
from app.game.events import Event, EventType
from app.game.exceptions import (
    PlayerLimitExceeded,
    PlayerNotFound,
    PlayerAlreadyConnected,
    PlayerInvalidNickname,
    ChangingPastPosition,
    ChangingFuturePosition,
    AirportFull,
    TooFarToLand,
    InvalidAirport,
    CantFlyWhenGrounded,
)
from app.game.models import PlayerPositionUpdateRequest, AirportLandingRequest, AirportDepartureRequest
from app.tools.encoder import encode
from app.tools.misc import random_with_probability
from app.tools.timestamp import timestamp_now
from app.tools.websocket_server import WebSocketSession


logging.getLogger().setLevel(logging.INFO)


class Shipment:
    id: uuid.UUID
    name: str
    award: int
    destination: "Airport"
    valid_till: Optional[int] = None

    def __init__(self, destination: "Airport"):
        self.id = uuid.uuid4()
        self.name = random.choice(Shipment.shipment_names())
        self.award = random.choice([100, 200, 300, 400, 500])
        self.destination = destination
        if random_with_probability(0.25):
            self.valid_till = timestamp_now() + 90*1000

    @staticmethod
    def shipment_names():
        return [
            "Mail",
            "Garbage from Aliexpress",
            "Masks & Vaccines",
            "Overpriced GPUs",
            "Futomaki",
            "Drones",
            "HAZMAT",
        ]

    @property
    def serialized(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "award": self.award,
            "destination_id": self.destination.id,
            "valid_till": self.valid_till,
        }


class PlayerPosition:
    coordinates: Coordinates
    bearing: float
    velocity: int
    timestamp: int

    def __init__(
        self,
        coordinates: Coordinates,
        bearing: float,
        velocity: int,
        timestamp: int,
    ):
        self.coordinates = coordinates
        self.bearing = bearing
        self.velocity = velocity
        self.timestamp = timestamp

    def future_position(self, timestamp_delta: int) -> "PlayerPosition":
        distance_traveled = self.velocity * timestamp_delta / 3600000  # s = v*t, convert timestamp to hours
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
            coordinates=Coordinates(
                latitude=random.uniform(-90, 90),
                longitude=random.uniform(-180, 180),
            ),
            bearing=random.uniform(0, 359),
            velocity=0,
            timestamp=timestamp_now(),
        )

    @property
    def serialized(self) -> dict:
        return {
            "coordinates": self.coordinates.serialized,
            "velocity": self.velocity,
            "bearing": self.bearing,
            "timestamp": self.timestamp,
        }


class Player:

    def __init__(self, nickname: str):
        self._id: uuid.UUID = uuid.uuid4()
        self._nickname: str = nickname
        self._token: str = uuid.uuid4().hex
        self._airport_id: Optional[uuid.UUID] = None
        self.disconnected_since: int = timestamp_now()
        self.session_id: Optional[uuid.UUID] = None
        self.position: PlayerPosition = PlayerPosition.random()
        self.score: int = 0
        self.shipment: Optional[Shipment] = None

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
    def is_grounded(self) -> bool:
        return bool(self._airport_id)

    @property
    def airport_id(self) -> uuid.UUID:
        return self._airport_id

    @property
    def serialized(self) -> dict:
        return {
            "id": self.id,
            "nickname": self.nickname,
            "connected": self.is_connected,
            "position": self.position.serialized,
            "shipment": self.shipment.serialized if self.shipment else None,
            "is_grounded": self.is_grounded,
        }


class Airport:
    MINIMUM_DISTANCE_TO_LAND = 3000

    id: uuid.UUID
    name: str
    coordinates: Coordinates
    shipments: List[Shipment]
    occupying_player: Optional[Player] = None

    def __init__(self, name: str, coordinates: Coordinates):
        self.id = uuid.uuid4()
        self.name = name
        self.coordinates = coordinates
        self.shipments = []

    @property
    def serialized(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "coordinates": self.coordinates.serialized,
            "occupying_player": self.occupying_player.id if self.occupying_player else None,
            "shipments": [shipment.serialized for shipment in self.shipments],
        }

    def land_player(self, player: Player):
        distance = Coordinates.distance_between(player.position.coordinates, self.coordinates)
        if distance > Airport.MINIMUM_DISTANCE_TO_LAND:
            raise TooFarToLand

        if self.occupying_player:
            raise AirportFull

        now = timestamp_now()

        self.occupying_player = player
        player._airport_id = self.id

        player.position.coordinates.latitude = self.coordinates.latitude
        player.position.coordinates.longitude = self.coordinates.longitude
        player.position.velocity = 0
        player.position.timestamp = now

    def remove_player(self, player: Player) -> bool:
        if player != self.occupying_player:
            return False
        self.occupying_player = None
        player._airport_id = None

        now = timestamp_now()
        player.position.coordinates.latitude = self.coordinates.latitude
        player.position.coordinates.longitude = self.coordinates.longitude
        player.position.velocity = 500000
        player.position.timestamp = now
        return True


class GameSession:
    MAX_PLAYERS = 16
    PLAYER_TIME_TO_CONNECT = 5000  # 5 seconds

    def __init__(self):
        self._players = {}
        self._sessions = {}
        self._airports = {}

        for airport_name, airport_coordinates in AIRPORTS:
            airport = Airport(name=airport_name, coordinates=airport_coordinates)
            self._airports[airport.id] = airport

        self.schedule_background_tasks()

    def schedule_background_tasks(self):
        """
        Manages the whole game runtime
        """
        t = threading.Thread(target=self.monitor_players)
        t.start()
        t = threading.Thread(target=self.manage_airports)
        t.start()

    def monitor_players(self):
        while True:
            self.remove_idle_players()
            time.sleep(0.2)

    def manage_airports(self):
        while True:
            time.sleep(5)

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

        # send game info
        player_list_event = Event(
            type=EventType.PLAYER_LIST,
            data={"players": self.player_list()},
        )
        self.send_event(event=player_list_event, player=player)
        airport_list_event = Event(
            type=EventType.AIRPORT_LIST,
            data={"airports": [airport.serialized for airport in self._airports.values()]}
        )
        self.send_event(event=airport_list_event, player=player)

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
            if player.is_grounded:
                airport = self._airports.get(player.airport_id)
                airport.remove_player(player)
                airport_updated_event = Event(type=EventType.AIRPORT_UPDATED, data=airport.serialized)
                self.broadcast_event(event=airport_updated_event)
            self._players.pop(player.id)
            event = Event(type=EventType.PLAYER_REMOVED, data=player.serialized)
            self.broadcast_event(event=event, everyone_except=[player])
        except KeyError:
            pass

    def update_player_position(self, player: Player, timestamp: int, velocity: int, bearing: float):
        logging.info(f"update_player_position {player.id} timestamp: {timestamp} V={velocity} bearing={bearing}")
        last_position = player.position
        MAX_FUTURE_TIME_DEVIATION = 500  # event can be at most 500ms in the future

        if player.is_grounded:
            raise CantFlyWhenGrounded

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
        self.broadcast_event(event=event)

    def handle_player_position_update_request_event(self, player: Player, event: Event):
        logging.info(f"handle_player_position_update_request_event {player.id} {event}")
        data_model = PlayerPositionUpdateRequest(**event.data)
        self.update_player_position(
            player=player,
            timestamp=data_model.timestamp,
            bearing=data_model.bearing,
            velocity=data_model.velocity,
        )

    def handle_airport_landing_request_event(self, player: Player, event: Event):
        logging.info(f"handle_airport_landing_request_event {player.id} {event}")
        data_model = AirportLandingRequest(**event.data)

        airport: Airport = self._airports.get(data_model.id)
        if not airport:
            raise InvalidAirport

        airport.land_player(player=player)

        airport_updated_event = Event(type=EventType.AIRPORT_UPDATED, data=airport.serialized)
        self.broadcast_event(event=airport_updated_event)

        position_updated_event = Event(type=EventType.PLAYER_POSITION_UPDATED, data={
            "id": player.id,
            "position": player.position.serialized,
            "is_grounded": player.is_grounded,
        })
        self.broadcast_event(event=position_updated_event)

    def handle_airport_departure_request_event(self, player: Player, event: Event):
        logging.info(f"handle_airport_departure_request_event {player.id} {event}")
        data_model = AirportDepartureRequest(**event.data)

        airport: Airport = self._airports.get(data_model.id)
        if not airport:
            raise InvalidAirport

        airport.remove_player(player=player)

        airport_updated_event = Event(type=EventType.AIRPORT_UPDATED, data=airport.serialized)
        self.broadcast_event(event=airport_updated_event)

        position_updated_event = Event(type=EventType.PLAYER_POSITION_UPDATED, data={
            "id": player.id,
            "position": player.position.serialized,
            "is_grounded": player.is_grounded,
        })
        self.broadcast_event(event=position_updated_event)

    def handle_event(self, player: Player, event: Event):
        logging.info(f"handle_event {player.id} {event}")

        if event.type == EventType.PLAYER_POSITION_UPDATE_REQUEST:
            self.handle_player_position_update_request_event(player=player, event=event)
            return

        if event.type == EventType.AIRPORT_LANDING_REQUEST:
            self.handle_airport_landing_request_event(player=player, event=event)
            return

        if event.type == EventType.AIRPORT_DEPARTURE_REQUEST:
            self.handle_airport_departure_request_event(player=player, event=event)
            return
