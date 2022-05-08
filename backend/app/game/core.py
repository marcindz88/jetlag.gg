import dataclasses
import datetime
import logging
import threading
import time
import uuid
from typing import Optional, List

from app.game.events import Event, EventType
from app.game.exceptions import PlayerLimitExceeded, PlayerNotFound, PlayerAlreadyConnected, PlayerInvalidNickname
from app.tools.encoder import encode
from app.tools.websocket_server import WebSocketSession


logging.getLogger().setLevel(logging.DEBUG)


class Player:

    def __init__(self, nickname: str):
        self._id: uuid.UUID = uuid.uuid4()
        self._nickname: str = nickname
        self._token: str = uuid.uuid4().hex
        self.disconnected_since: datetime.datetime = datetime.datetime.now()
        self.session_id: Optional[uuid.UUID] = None

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


class GameSession:
    MAX_PLAYERS = 10
    PLAYER_TIME_TO_CONNECT = datetime.timedelta(seconds=30)

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
            time.sleep(2)  # todo remove

    def broadcast_event(self, event: Event, everyone_except: List[Player] = None):
        logging.info("broadcast_event")
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
        return [
            {"id": p.id, "nickname": p.nickname, "connected": p.is_connected}
            for p in self._players.values()
        ]

    def remove_idle_players(self):
        logging.info(f"remove_idle_players")
        now = datetime.datetime.now()

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
        event = Event(type=EventType.PLAYER_REGISTERED, data={"id": player.id, "nickname": player.nickname})
        self.broadcast_event(event=event, everyone_except=[player])
        logging.info(f"add_player {nickname} added {player.id}")
        return player

    def add_session(self, player: Player, ws_session: WebSocketSession):
        logging.info(f"add_session {ws_session.id} for player {player.id}")
        if player.is_connected:
            raise PlayerAlreadyConnected
        self._sessions[ws_session.id] = (ws_session, player)
        player.session_id = ws_session.id
        event = Event(type=EventType.PLAYER_CONNECTED, data={"id": player.id, "nickname": player.nickname})
        self.broadcast_event(event=event, everyone_except=[player])

    def remove_session(self, ws_session: WebSocketSession):
        logging.info(f"remove_session {ws_session.id}")
        ws_session.close_connection()
        self._sessions.pop(ws_session.id, None)
        player = self.get_player(player_id=ws_session.player_id)
        player.session_id = None
        player._disconnected_since = datetime.datetime.now()
        event = Event(type=EventType.PLAYER_DISCONNECTED, data={"id": player.id, "nickname": player.nickname})
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
            event = Event(type=EventType.PLAYER_REMOVED, data={"id": player.id, "nickname": player.nickname})
            self.broadcast_event(event=event, everyone_except=[player])
        except KeyError:
            pass
