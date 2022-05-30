import dataclasses
import logging
import random
import threading
import time
import uuid
from typing import Optional, List

from app.game.config import GameConfig
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
    ShipmentOperationWhenFlying,
    ShipmentNotFound,
    InvalidOperation,
    ShipmentExpired,
    ShipmentDestinationInvalid,
    InvalidVelocity,
)
from app.game.models import (
    PlayerPositionUpdateRequest,
    AirportRequest,
    ShipmentRequest,
)
from app.tools.encoder import encode
from app.tools.misc import random_with_probability
from app.tools.timestamp import timestamp_now
from app.tools.websocket_server import WebSocketSession


logging.getLogger().setLevel(logging.INFO)


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
        scaling = 100000
        return int(distance_between_endpoints / self.time_to_deliver * random_factor * scaling)

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
            "is_grounded": self.is_grounded,
            "score": self.score,
            "position": self.position.serialized,
            "shipment": self.shipment.serialized if self.shipment else None,
        }


class Airport:
    id: uuid.UUID
    name: str
    full_name: str
    description: str
    coordinates: Coordinates
    elevation: float
    shipments: dict = {}
    occupying_player: Optional[Player] = None

    def __init__(self, name: str, full_name: str, description: str, elevation: float, coordinates: Coordinates):
        self.id = uuid.uuid4()
        self.name = name
        self.full_name = full_name
        self.description = description
        self.coordinates = coordinates
        self.elevation = elevation
        self.shipments = {}

    @property
    def serialized(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "full_name": self.full_name,
            "description": self.description,
            "elevation": self.elevation,
            "coordinates": self.coordinates.serialized,
            "occupying_player": self.occupying_player.id if self.occupying_player else None,
            "shipments": [shipment.serialized for shipment in self.shipments.values()],
        }

    def land_player(self, player: Player):
        now = timestamp_now()
        current_player_position = player.position.future_position(timestamp_delta=now-player.position.timestamp)
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

    def dispatch_shipment(self, shipment_id: uuid.UUID, player: Player) -> Shipment:
        if player != self.occupying_player:
            raise InvalidOperation

        if player.shipment:
            raise InvalidOperation

        shipment: Shipment = self.shipments.get(shipment_id)
        if not shipment:
            raise ShipmentNotFound

        shipment.player_id = player.id
        player.shipment = shipment
        self.shipments.pop(shipment_id)
        return shipment

    def accept_shipment_delivery(self, player: Player) -> Shipment:
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
        return shipment


class GameSession:
    config = GameConfig()

    def __init__(self):
        self._players = {}
        self._sessions = {}
        self._airports = {}
        self._shipments = {}

        for airport_data in AIRPORTS:
            airport = Airport(
                name=airport_data['name'],
                full_name=airport_data['full_name'],
                description=airport_data['description'],
                coordinates=airport_data['coordinates'],
                elevation=airport_data['elevation'],
            )
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
            self.remove_expired_shipments()
            time.sleep(0.2)
            if random_with_probability(0.045):
                self.add_random_airport_shipment()

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
            if now - player.disconnected_since > self.config.PLAYER_TIME_TO_CONNECT:
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
        if len(self._players) >= self.config.MAX_PLAYERS:
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

        if velocity < self.config.MIN_VELOCITY or velocity > self.config.MAX_VELOCITY:
            logging.warning(f"update_player_position invalid velocity: %s", velocity)
            raise InvalidVelocity

        new_position = last_position.future_position(timestamp_delta=timestamp-last_position.timestamp)
        new_position.velocity = velocity  # todo more validation (delta)
        new_position.bearing = bearing  # todo validation

        player.position = new_position
        event = Event(type=EventType.PLAYER_POSITION_UPDATED, data={
            "id": player.id,
            "is_grounded": player.is_grounded,
            "position": new_position.serialized,
        })
        self.broadcast_event(event=event)

    def add_random_airport_shipment(self):
        if len(self._shipments) >= self.config.MAX_SHIPMENTS_IN_GAME:
            return
        origin_airport_id = random.choice(list(self._airports.keys()))
        destination_airport_id = random.choice(list(set(self._airports.keys()) - {origin_airport_id}))

        origin_airport = self._airports[origin_airport_id]
        destination_airport = self._airports[destination_airport_id]

        shipment = Shipment(destination=destination_airport, origin=origin_airport)
        self._shipments[shipment.id] = shipment
        origin_airport.shipments[shipment.id] = shipment

        airport_updated_event = Event(type=EventType.AIRPORT_UPDATED, data=origin_airport.serialized)
        self.broadcast_event(event=airport_updated_event)

    def remove_expired_shipments(self):
        shipments_to_remove = []
        for shipment in self._shipments.values():
            if shipment.valid_till + 3*1000 < timestamp_now():
                shipments_to_remove.append(shipment)
        for shipment in shipments_to_remove:
            self._shipments.pop(shipment.id)
            player: Player = self._players.get(shipment.player_id)
            if player:
                player.shipment = None
                player_updated_event = Event(type=EventType.PLAYER_UPDATED, data=player.serialized)
                self.broadcast_event(event=player_updated_event)
            else:
                airport: Airport = self._airports.get(shipment.origin_id)
                airport.shipments.pop(shipment.id)
                airport_updated_event = Event(type=EventType.AIRPORT_UPDATED, data=airport.serialized)
                self.broadcast_event(event=airport_updated_event)

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
        data_model = AirportRequest(**event.data)

        airport: Airport = self._airports.get(data_model.id)
        if not airport:
            raise InvalidAirport

        airport.land_player(player=player)

        airport_updated_event = Event(type=EventType.AIRPORT_UPDATED, data=airport.serialized)
        self.broadcast_event(event=airport_updated_event)

        position_updated_event = Event(type=EventType.PLAYER_POSITION_UPDATED, data={
            "id": player.id,
            "is_grounded": player.is_grounded,
            "position": player.position.serialized,
        })
        self.broadcast_event(event=position_updated_event)

    def handle_airport_departure_request_event(self, player: Player, event: Event):
        logging.info(f"handle_airport_departure_request_event {player.id} {event}")
        data_model = AirportRequest(**event.data)

        airport: Airport = self._airports.get(data_model.id)
        if not airport:
            raise InvalidAirport

        airport.remove_player(player=player)

        airport_updated_event = Event(type=EventType.AIRPORT_UPDATED, data=airport.serialized)
        self.broadcast_event(event=airport_updated_event)

        position_updated_event = Event(type=EventType.PLAYER_POSITION_UPDATED, data={
            "id": player.id,
            "is_grounded": player.is_grounded,
            "position": player.position.serialized,
        })
        self.broadcast_event(event=position_updated_event)

    def handle_shipment_dispatch_request_event(self, player: Player, event: Event):
        logging.info(f"handle_shipment_dispatch_request_event {player.id} {event}")
        data_model = ShipmentRequest(**event.data)

        if not player.is_grounded:
            raise ShipmentOperationWhenFlying

        airport: Airport = self._airports.get(player.airport_id)
        airport.dispatch_shipment(shipment_id=data_model.id, player=player)

        player_updated_event = Event(type=EventType.PLAYER_UPDATED, data=player.serialized)
        self.broadcast_event(event=player_updated_event)

        airport_updated_event = Event(type=EventType.AIRPORT_UPDATED, data=airport.serialized)
        self.broadcast_event(event=airport_updated_event)

    def handle_shipment_delivery_request_event(self, player: Player, event: Event):
        logging.info(f"handle_shipment_delivery_request_event {player.id} {event}")

        if not player.is_grounded:
            raise ShipmentOperationWhenFlying

        airport: Airport = self._airports.get(player.airport_id)
        shipment = airport.accept_shipment_delivery(player=player)
        self._shipments.pop(shipment.id)

        player_updated_event = Event(type=EventType.PLAYER_UPDATED, data=player.serialized)
        self.broadcast_event(event=player_updated_event)

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

        if event.type == EventType.AIRPORT_SHIPMENT_DISPATCH_REQUEST:
            self.handle_shipment_dispatch_request_event(player=player, event=event)
            return

        if event.type == EventType.AIRPORT_SHIPMENT_DELIVERY_REQUEST:
            self.handle_shipment_delivery_request_event(player=player, event=event)
            return
