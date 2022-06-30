from typing import List

from app.game.core.airport import Airport
from app.game.core.player import Player
from app.game.core.shipment import Shipment
from app.game.events import Event, EventType


class EventFactory:

    @staticmethod
    def airport_updated_event(airport: "Airport") -> Event:
        return Event(type=EventType.AIRPORT_UPDATED, data=airport.serialized)

    @staticmethod
    def airport_list_event(airport_list: List["Airport"]) -> Event:
        return Event(
            type=EventType.AIRPORT_LIST,
            data={"airports": [airport.serialized for airport in airport_list]}
        )

    @staticmethod
    def refueling_stopped_event(airport: "Airport", player: "Player") -> Event:
        return Event(type=EventType.AIRPORT_REFUELING_STOPPED, data={
            "id": airport.id,
            "player_id": player.id,
        })

    @staticmethod
    def shipment_delivered_event(shipment: "Shipment") -> Event:
        return Event(type=EventType.AIRPORT_SHIPMENT_DELIVERED, data=shipment.serialized)

    @staticmethod
    def player_updated_event(player: "Player") -> Event:
        return Event(type=EventType.PLAYER_UPDATED, data=player.serialized)

    @staticmethod
    def player_registered_event(player: "Player") -> Event:
        return Event(type=EventType.PLAYER_REGISTERED, data=player.serialized)

    @staticmethod
    def player_connected_event(player: "Player") -> Event:
        return Event(type=EventType.PLAYER_CONNECTED, data=player.serialized)

    @staticmethod
    def player_disconnected_event(player: "Player") -> Event:
        return Event(type=EventType.PLAYER_DISCONNECTED, data=player.serialized)

    @staticmethod
    def player_removed_event(player: "Player") -> Event:
        return Event(type=EventType.PLAYER_REMOVED, data=player.serialized)

    @staticmethod
    def player_list_event(player_list: List["Player"]) -> Event:
        return Event(
            type=EventType.PLAYER_LIST,
            data={"players": [player.serialized for player in player_list]},
        )

    @staticmethod
    def player_position_updated_event(player: "Player") -> Event:
        return Event(type=EventType.PLAYER_POSITION_UPDATED, data={
            "id": player.id,
            "is_grounded": player.is_grounded,
            "position": player.position.serialized,
        })
