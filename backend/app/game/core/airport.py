import logging
import uuid
from typing import Optional, TYPE_CHECKING

from app.game.config import GameConfig
from app.game.core.coordinates import Coordinates
from app.game.exceptions import (
    TooFarToLand,
    AirportFull,
    InvalidOperation,
    ShipmentNotFound,
    ShipmentDestinationInvalid,
    ShipmentExpired,
)
from app.tools.timestamp import timestamp_now


if TYPE_CHECKING:
    from app.game.core.shipment import Shipment
    from app.game.core.player import Player


class Airport:
    id: uuid.UUID
    name: str
    full_name: str
    description: str
    coordinates: "Coordinates"
    elevation: float
    shipments: dict = {}
    occupying_player: Optional["Player"] = None

    def __init__(
        self,
        name: str,
        full_name: str,
        description: str,
        elevation: float,
        fuel_price: float,
        coordinates: "Coordinates",
    ):
        self.id = uuid.uuid4()
        self.name = name
        self.full_name = full_name
        self.description = description
        self.coordinates = coordinates
        self.elevation = elevation
        self.fuel_price = fuel_price
        self.shipments = {}

    @property
    def serialized(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "full_name": self.full_name,
            "description": self.description,
            "elevation": self.elevation,
            "fuel_price": self.fuel_price,
            "coordinates": self.coordinates.serialized,
            "occupying_player": self.occupying_player.id if self.occupying_player else None,
            "shipments": [shipment.serialized for shipment in self.shipments.values()],
        }

    def land_player(self, player: "Player"):
        now = timestamp_now()
        current_player_position = player.position.future_position(timestamp=now)
        logging.info(
            "land_player player coords %s, airport coords %s",
            current_player_position.coordinates.serialized,
            self.coordinates.serialized,
        )
        distance = Coordinates.distance_between(current_player_position.coordinates, self.coordinates)
        logging.info("distance between: %s, max distance: %s", distance, GameConfig.AIRPORT_MAXIMUM_DISTANCE_TO_LAND)
        if distance > GameConfig.AIRPORT_MAXIMUM_DISTANCE_TO_LAND:
            raise TooFarToLand

        if self.occupying_player:
            raise AirportFull

        self.occupying_player = player
        player._airport_id = self.id

        player.position = current_player_position
        player.position.coordinates.latitude = self.coordinates.latitude
        player.position.coordinates.longitude = self.coordinates.longitude
        player.position.velocity = 0
        player.position.timestamp = now

    def remove_player(self, player: "Player") -> bool:
        if player != self.occupying_player:
            return False
        self.occupying_player = None
        player._airport_id = None

        now = timestamp_now()
        player.position.coordinates.latitude = self.coordinates.latitude
        player.position.coordinates.longitude = self.coordinates.longitude
        player.position.velocity = 500000
        player.position.timestamp = now
        player.is_refueling = False
        return True

    def dispatch_shipment(self, shipment_id: uuid.UUID, player: "Player") -> "Shipment":
        if player != self.occupying_player:
            raise InvalidOperation

        if player.shipment:
            raise InvalidOperation

        shipment: "Shipment" = self.shipments.get(shipment_id)
        if not shipment:
            raise ShipmentNotFound

        shipment.player_id = player.id
        player.shipment = shipment
        self.shipments.pop(shipment_id)
        return shipment

    def accept_shipment_delivery(self, player: "Player") -> "Shipment":
        if player != self.occupying_player:
            raise InvalidOperation

        shipment = player.shipment
        if not shipment:
            raise ShipmentNotFound

        if shipment.destination_id != self.id:
            raise ShipmentDestinationInvalid

        if shipment.valid_till < timestamp_now():
            raise ShipmentExpired

        player.score += player.shipment.award
        player.shipment = None
        player.shipments_delivered += 1
        return shipment
