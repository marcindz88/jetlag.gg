import dataclasses
from abc import abstractmethod, ABC
from typing import Optional, List

from app.game.enums import DeathCause


@dataclasses.dataclass
class Player:
    full_nickname: str
    token: str
    position: Optional[int]  # player always has a position, but not always it is necessary to retrieve it
    best_score: Optional[int]
    best_shipment_num: Optional[int]
    best_time_alive: Optional[int]
    best_timestamp: Optional[int]
    best_death_cause: Optional[DeathCause]

    @property
    def serialized(self):
        return {
            "nickname": self.full_nickname,
            "position": self.position,
            "best_game": {
                "score": self.best_score,
                "delivered_shipments": self.best_shipment_num,
                "time_alive": self.best_time_alive,
                "timestamp": self.best_timestamp,
                "death_cause": self.best_death_cause,
            } if self.best_score >= 0 else None
        }


@dataclasses.dataclass
class PlayerList:
    total: int
    results: List[Player]

    @property
    def serialized(self):
        return {
            "total": self.total,
            "results": [p.serialized for p in self.results]
        }


@dataclasses.dataclass
class Game:
    score: int
    shipment_num: int
    time_alive: int
    timestamp: int
    death_cause: DeathCause

    @property
    def serialized(self):
        return {
            "score": self.score,
            "delivered_shipments": self.shipment_num,
            "time_alive": self.time_alive,
            "timestamp": self.timestamp,
            "death_cause": self.death_cause,
        }


class BasePersistentStorage(ABC):

    @abstractmethod
    def add_new_player(self, nickname: str) -> Player:
        raise NotImplemented

    @abstractmethod
    def get_player_by_token(self, token: str) -> Optional[Player]:
        raise NotImplemented

    @abstractmethod
    def get_player_list(self, limit: int, offset: int) -> PlayerList:
        raise NotImplemented

    @abstractmethod
    def get_player(self, full_nickname: str) -> Optional[Player]:
        # for leaderboard needs, so return with a position
        raise NotImplemented

    @abstractmethod
    def get_players_last_games(self, full_nickname: str, amount=10) -> List[Game]:
        raise NotImplemented

    @abstractmethod
    def add_game_record(
        self,
        full_nickname: str,
        timestamp: int,
        score: int,
        shipments_delivered: int,
        time_alive: int,
        death_cause: DeathCause,
    ) -> None:
        raise NotImplemented

    @abstractmethod
    def clear_db(self) -> None:
        raise NotImplemented
