import uuid
from typing import Optional

from app.game.core.position import PlayerPosition
from app.game.core.shipment import Shipment
from app.game.enums import DeathCause
from app.tools.timestamp import timestamp_now


class Player:

    def __init__(self, nickname: str, color: str, bot: bool = False):
        self._id: uuid.UUID = uuid.uuid4()
        self._nickname: str = nickname
        self._token: str = uuid.uuid4().hex
        self._airport_id: Optional[uuid.UUID] = None
        self.disconnected_since: int = timestamp_now()
        self.session_id: Optional[uuid.UUID] = None
        self.position: "PlayerPosition" = PlayerPosition.random()
        self.score: int = 0
        self.is_bot: bool = bot
        self.shipment: Optional["Shipment"] = None
        self.color: str = color
        self.is_refueling: bool = False
        self.death_cause: Optional[DeathCause] = None

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
        return self.is_bot or bool(self.session_id)

    @property
    def is_grounded(self) -> bool:
        return bool(self._airport_id)

    @property
    def is_dead(self) -> bool:
        return bool(self.death_cause)

    @property
    def airport_id(self) -> uuid.UUID:
        return self._airport_id

    @property
    def serialized(self) -> dict:
        return {
            "id": self.id,
            "nickname": self.nickname,
            "color": self.color,
            "connected": self.is_connected,
            "is_grounded": self.is_grounded,
            "is_bot": self.is_bot,
            "score": self.score,
            "death_cause": self.death_cause,
            "position": self.position.serialized,
            "shipment": self.shipment.serialized if self.shipment else None,
        }