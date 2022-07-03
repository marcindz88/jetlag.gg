import dataclasses
from abc import abstractmethod, ABC
from typing import Optional, List


@dataclasses.dataclass
class Player:
    full_nickname: str
    token: str
    best_score: Optional[int]
    best_shipment_num: Optional[int]
    best_time_alive: Optional[int]
    best_timestamp: Optional[int]


@dataclasses.dataclass
class PlayerList:
    total: int
    results: List[Player]

    @property
    def serialized(self):
        return {
            "total": self.total,
            "results": [
                {
                    "nickname": p.full_nickname,
                    "best_game": {
                        "score": p.best_score,
                        "delivered_shipments": p.best_shipment_num,
                        "time_alive": p.best_time_alive,
                        "timestamp": p.best_timestamp,
                    } if p.best_score >= 0 else None
                } for p in self.results
            ]
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
    def add_game_record(
        self,
        full_nickname: str,
        timestamp: int,
        score: int,
        shipments_delivered: int,
        time_alive: int,
    ) -> None:
        raise NotImplemented

    @abstractmethod
    def clear_db(self) -> None:
        raise NotImplemented
