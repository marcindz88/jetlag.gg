import datetime
import uuid
from typing import Optional, List

from app.game.exceptions import PlayerLimitExceeded, PlayerNotFound, PlayerAlreadyConnected, PlayerInvalidNickname
from app.tools.websocket_server import WebSocketSession


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
    PLAYER_TIME_TO_CONNECT = datetime.timedelta(seconds=10)

    def __init__(self):
        self._players = {}
        self._sessions = {}

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
        if len(self._players) >= self.MAX_PLAYERS:
            raise PlayerLimitExceeded
        for player in self._players.values():
            if player.nickname.lower().strip() == nickname.lower().strip():
                raise PlayerInvalidNickname
        player = Player(nickname=nickname)
        self._players[player.id] = player
        return player

    def add_session(self, player: Player, ws_session: WebSocketSession):
        if player.is_connected:
            raise PlayerAlreadyConnected
        self._sessions[ws_session.id] = (ws_session, player)
        player.session_id = ws_session.id

    def remove_session(self, ws_session: WebSocketSession):
        ws_session.close_connection()
        self._sessions.pop(ws_session.id, None)
        player = self.get_player(player_id=ws_session.player_id)
        player.session_id = None
        player._disconnected_since = datetime.datetime.now()

    def remove_player(self, player: Player):
        try:
            ws_session = self.get_players_session(player.id)
        except PlayerNotFound:
            return

        self.remove_session(ws_session)
        self._players.pop(player.id, None)
