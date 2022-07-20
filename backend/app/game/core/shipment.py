import random
import uuid
from typing import Optional, TYPE_CHECKING

from app.game.core.coordinates import Coordinates
from app.tools.timestamp import timestamp_now

if TYPE_CHECKING:
    from app.game.core.airport import Airport


class Shipment:

    id: uuid.UUID
    name: str
    award: int
    _origin: "Airport"
    _destination: "Airport"
    time_to_deliver: int
    valid_till: int
    player_id: Optional[uuid.UUID] = None  # id of the player that is transporting the shipment

    def __init__(self, origin: "Airport", destination: "Airport"):
        self.id = uuid.uuid4()
        self.name = random.choice(Shipment.shipment_names())
        self._origin = origin
        self._destination = destination
        self.time_to_deliver = random.randint(50, 90) * 1000
        self.award = self._get_random_award()
        self.valid_till = timestamp_now() + self.time_to_deliver
        self.player_id = None

    def _get_random_award(self):
        distance_between_endpoints = Coordinates.distance_between(
            coord1=self._origin.coordinates,
            coord2=self._destination.coordinates,
        )
        random_factor = random.uniform(0.85, 1.15)
        scaling = 150000
        return int(distance_between_endpoints / self.time_to_deliver * random_factor * scaling)

    @staticmethod
    def shipment_names():
        return [
            "Mail",
            "Aliexpress Garbage",
            "Masks & Vaccines",
            "Overpriced GPUs",
            "Futomaki",
            "Drones",
            "HAZMAT",
        ]

    @property
    def origin_id(self):
        return self._origin.id

    @property
    def destination_id(self):
        return self._destination.id

    @property
    def serialized(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "award": self.award,
            "origin_id": self.origin_id,
            "destination_id": self.destination_id,
            "valid_till": self.valid_till,
        }
