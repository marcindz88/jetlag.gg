import dataclasses
import logging
import random
import threading
import time
import uuid
from typing import List

from app.game.config import GameConfig
from app.game.consts import AIRPORTS, BOT_NAMES, COLORS
from app.game.core.coordinates import Coordinates
from app.game.core.airport import Airport
from app.game.core.shipment import Shipment
from app.game.core.player import Player
from app.game.enums import DeathCause
from app.game.event_factory import EventFactory
from app.game.events import Event, EventType
from app.game.exceptions import (
    AirportFull,
    ShipmentExpired,
    PlayerNotFound,
    PlayerLimitExceeded,
    PlayerAlreadyConnected,
    CantFlyWhenGrounded,
    ChangingPastPosition,
    ChangingFuturePosition,
    InvalidVelocity,
    InvalidAirport,
    ShipmentOperationWhenFlying,
    RefuelingWhenFlying,
    DuplicatedGameSession,
)
from app.game.models import PlayerPositionUpdateRequest, AirportRequest, ShipmentRequest
from app.game.persistence.base import BasePersistentStorage
from app.tools.encoder import encode
from app.tools.misc import random_with_probability
from app.tools.timestamp import timestamp_now
from app.tools.websocket_server import WebSocketSession


logging.getLogger().setLevel(logging.INFO)


class GameSession:
    config = GameConfig()
    FILL_GAME_WITH_BOTS_TILL = 10
    SPAWN_BOTS_WHEN_NO_PLAYERS = False

    def __init__(self, storage: BasePersistentStorage):
        self._players = {}
        self._sessions = {}
        self._airports = {}
        self._shipments = {}
        self._bots = {}
        self._storage = storage

        for airport_data in AIRPORTS:
            airport = Airport(
                name=airport_data["name"],
                full_name=airport_data["full_name"],
                description=airport_data["description"],
                coordinates=airport_data["coordinates"],
                elevation=airport_data["elevation"],
                fuel_price=airport_data["fuel_price"] * 0.3,
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
        t = threading.Thread(target=self.manage_bots)
        t.start()

    def monitor_players(self):
        while True:
            self.remove_idle_players()
            self.check_playing_conditions()
            time.sleep(0.2)

    def manage_airports(self):
        while True:
            self.remove_expired_shipments()
            time.sleep(0.2)
            if random_with_probability(0.085):
                self.add_random_airport_shipment()

    def manage_bots(self):
        while True:
            real_players_count = self.real_players_count()
            bot_players_count = self.bot_players_count()

            if real_players_count == 0 and self.SPAWN_BOTS_WHEN_NO_PLAYERS is False:
                target_bot_count = 0
            else:
                target_bot_count = max(self.FILL_GAME_WITH_BOTS_TILL - real_players_count, 0)

            delta = target_bot_count - bot_players_count
            for _ in range(abs(delta)):
                if delta > 0:
                    self.increase_bot_count()
                else:
                    self.decrease_bot_count()
            time.sleep(1)

    def increase_bot_count(self):
        nickname_set = set(BOT_NAMES) - set([self._players[p].nickname for p in self._bots.keys()])
        nickname = random.choice(list(nickname_set))
        player = Player(nickname=nickname, color=self._generate_player_color(), bot=True, token=uuid.uuid4().hex)
        self._players[player.id] = player
        self.broadcast_event(event=EventFactory.player_registered_event(player=player))

        thread = threading.Thread(target=self.play_with_bot, args=(player.id,))
        self._bots[player.id] = {"thread": thread, "created": timestamp_now()}
        thread.start()

    def decrease_bot_count(self):
        bots = [(self._players[player_id], bot_data["created"]) for player_id, bot_data in self._bots.items()]
        bots = sorted(bots, key=lambda b: b[1])
        bot_to_remove: Player = bots[0][0]  # select the oldest bot
        self._bots.pop(bot_to_remove.id)

    def play_with_bot(self, player_id: uuid.UUID):

        while True:
            player: Player = self._players[player_id]
            if player_id not in self._bots:
                self.remove_player(player)
                return

            if player.shipment:
                destination_airport = self._airports[player.shipment.destination_id]
            else:
                destination_airport = random.choice(list(self._airports.values()))
            result = self._fly_bot_to_point(
                player_id=player_id,
                destination_coordinates=destination_airport.coordinates,
                minimum_distance=100,
            )
            if not result:
                return

            try:
                logging.info("bot landing attempt %s %s", player.id, player.nickname)
                try:
                    self.handle_airport_landing(player=player, airport=destination_airport)
                except AirportFull as e:
                    if destination_airport.occupying_player != player:
                        raise e
                logging.info("bot landed %s %s", player.id, player.nickname)
                arrival_time = timestamp_now()

                if player.shipment:
                    try:
                        self.handle_shipment_delivery(airport=destination_airport, player=player)
                    except ShipmentExpired:
                        pass
                self.refuel_player(player=player, airport=destination_airport)
                idle_time_left = max(5000 - (timestamp_now() - arrival_time), 0)
                time.sleep(idle_time_left / 1000)

                shipment_ids = list(destination_airport.shipments.keys())
                if shipment_ids:
                    self.handle_shipment_dispatch(
                        airport=destination_airport,
                        player=player,
                        shipment_id=random.choice(shipment_ids),
                    )
                self.handle_airport_departure(player=player, airport=destination_airport)
            except AirportFull:
                logging.info("bot landing failed, airport full %s %s", player.id, player.nickname)

    def _fly_bot_to_point(
        self,
        player_id: uuid.UUID,
        destination_coordinates: Coordinates,
        minimum_distance: int = 300,
    ):
        minimum_sleep_duration = 0.05
        min_velocity = self.config.FLYING_VELOCITY
        max_velocity = self.config.MAX_VELOCITY
        while True:
            player: Player = self._players[player_id]
            if player_id not in self._bots:
                self.remove_player(player)
                return False

            now = timestamp_now() + 1
            current_player_position = player.position.future_position(
                timestamp=now,
                calculate_bearing=True,
            )
            distance_to_destination = Coordinates.distance_between(
                current_player_position.coordinates,
                destination_coordinates,
            )
            if distance_to_destination <= minimum_distance:
                return True

            ideal_bearing_to_destination = Coordinates.bearing_between(
                current_player_position.coordinates,
                destination_coordinates,
            )

            left = (360 - ideal_bearing_to_destination + current_player_position.bearing) % 360
            right = (360 - current_player_position.bearing + ideal_bearing_to_destination) % 360
            bearing_diff = min(left, right)
            bearing_delta = min(2.0, bearing_diff)
            if left < right:
                bearing_delta = -bearing_delta
            bearing = current_player_position.bearing + bearing_delta

            current_velocity = player.position.velocity
            if abs(bearing_diff) > 90:
                velocity_delta = -10000
            else:
                velocity_delta = 10000
            velocity = current_velocity + velocity_delta
            velocity = max(min_velocity, velocity)
            velocity = min(max_velocity, velocity)

            self.update_player_position(
                player=player,
                timestamp=now,
                velocity=velocity,
                bearing=bearing,
            )

            sleep_duration = minimum_sleep_duration
            if abs(bearing_delta) < 0.01 and velocity == max_velocity:
                distance_to_destination = max(distance_to_destination - minimum_distance * 1.1, 0)
                sleep_duration = distance_to_destination / velocity * 3600

                sleep_duration = max(sleep_duration, minimum_sleep_duration)
                sleep_duration = min(sleep_duration, 3)  # not more than 3 seconds for synchronisation reasons
            time.sleep(sleep_duration)

    def send_event(self, event: Event, player: Player):
        if player.is_bot:
            return
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

    def real_players_count(self) -> int:
        return len(self._players) - len(self._bots)

    def bot_players_count(self) -> int:
        return len(self._bots)

    def get_player(self, player_id: uuid.UUID) -> Player:
        player = self._players.get(player_id)
        if not player:
            raise PlayerNotFound
        return player

    def remove_idle_players(self):
        logging.debug(f"remove_idle_players")
        now = timestamp_now()

        for player in list(self._players.values()):
            if player.is_bot:
                continue
            if player.is_connected:
                continue
            if now - player.disconnected_since > self.config.PLAYER_TIME_TO_CONNECT:
                self.pronounce_player_dead(player=player, cause=DeathCause.DISCONNECTED)

    def check_playing_conditions(self):
        logging.debug(f"check_playing_conditions")
        now = timestamp_now()

        for player in list(self._players.values()):
            if player.is_dead:
                # death has already been detected but player has not been removed yet, no need to do anything
                continue

            if player.is_grounded:
                # player shouldn't die when landed
                continue

            # check tank level
            current_tank_level = player.position.future_tank_level(timestamp=now)
            if current_tank_level == 0:
                self.pronounce_player_dead(player=player, cause=DeathCause.RUN_OUT_OF_FUEL)
                continue

            # check speed
            if player.position.velocity < GameConfig.FLYING_VELOCITY:
                self.pronounce_player_dead(player=player, cause=DeathCause.SPEED_TOO_LOW)
                continue

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

    def _generate_player_color(self):
        available_colors = list(set(COLORS) - set([p.color for p in self._players.values()]))
        return random.choice(available_colors)

    def add_player(self, nickname: str, token: str) -> Player:
        logging.info(f"add_player {nickname}")
        if len(self._players) >= self.config.MAX_PLAYERS:
            raise PlayerLimitExceeded

        for player in self._players.values():
            if player.is_bot:
                continue

            if player.token == token:
                raise DuplicatedGameSession

        player = Player(nickname=nickname, token=token, color=self._generate_player_color())
        self._players[player.id] = player
        self.broadcast_event(event=EventFactory.player_registered_event(player=player), everyone_except=[player])
        logging.info(f"add_player {nickname} added {player.id}")
        return player

    def add_session(self, player: Player, ws_session: WebSocketSession):
        logging.info(f"add_session {ws_session.id} for player {player.id}")
        if player.is_connected:
            raise PlayerAlreadyConnected
        self._sessions[ws_session.id] = (ws_session, player)
        player.session_id = ws_session.id
        self.broadcast_event(event=EventFactory.player_connected_event(player=player), everyone_except=[player])

        # send game info
        self.send_event(event=EventFactory.player_list_event(player_list=list(self._players.values())), player=player)
        self.send_event(
            event=EventFactory.airport_list_event(airport_list=list(self._airports.values())), player=player
        )

    def remove_session(self, ws_session: WebSocketSession):
        logging.info(f"remove_session {ws_session.id}")
        ws_session.close_connection()
        self._sessions.pop(ws_session.id, None)
        player = self.get_player(player_id=ws_session.player_id)
        player.session_id = None
        player.disconnected_since = timestamp_now()
        self.broadcast_event(event=EventFactory.player_disconnected_event(player=player), everyone_except=[player])

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
                self.broadcast_event(event=EventFactory.airport_updated_event(airport=airport))
            self._players.pop(player.id)
            self.broadcast_event(event=EventFactory.player_removed_event(player=player), everyone_except=[player])
        except KeyError:
            pass

    def pronounce_player_dead(self, player: Player, cause: DeathCause):
        # XD
        player.death_cause = cause
        self.broadcast_event(event=EventFactory.player_updated_event(player=player))

        if player.is_bot:
            self._bots.pop(player.id)
            return
        now = timestamp_now()
        self._storage.add_game_record(
            full_nickname=player.nickname,
            timestamp=now,
            score=player.score,
            shipments_delivered=player.shipments_delivered,
            time_alive=now-player.joined,
            death_cause=cause,
        )
        self.remove_player(player=player)

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

        new_position = last_position.future_position(timestamp=timestamp)
        new_position.velocity = velocity  # todo more validation (delta)
        new_position.bearing = bearing  # todo validation

        player.position = new_position
        self.broadcast_event(event=EventFactory.player_position_updated_event(player=player))

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

        self.broadcast_event(event=EventFactory.airport_updated_event(airport=origin_airport))

    def remove_expired_shipments(self):
        shipments_to_remove = []
        for shipment in self._shipments.values():
            if shipment.valid_till + 3 * 1000 < timestamp_now():
                shipments_to_remove.append(shipment)
        for shipment in shipments_to_remove:
            self._shipments.pop(shipment.id, None)
            player: Player = self._players.get(shipment.player_id)
            if player:
                player.shipment = None
                self.broadcast_event(event=EventFactory.player_updated_event(player=player))

            airport: Airport = self._airports.get(shipment.origin_id)
            if airport.shipments.pop(shipment.id, None):
                self.broadcast_event(event=EventFactory.airport_updated_event(airport=airport))

    def refuel_player(self, player: Player, airport: Airport):
        now = timestamp_now()
        player.position.tank_level = player.position.future_tank_level(timestamp=now)
        player.position.timestamp = now

        player.is_refueling = True
        refueling_refresh_time = 0.2  # how much each iteration takes [s]
        while True:
            time.sleep(refueling_refresh_time)
            if not player.is_refueling:
                break
            if player.position.tank_level == GameConfig.FUEL_TANK_SIZE:
                break
            if player.score == 0:
                logging.info(f"Player {player} has no money to refuel!")
                break

            added_fuel = refueling_refresh_time * GameConfig.REFUELING_RATE
            price = int(airport.fuel_price * added_fuel)
            if player.score < price:
                price = player.score
                added_fuel = price / airport.fuel_price

            player.score -= price

            new_level = player.position.tank_level + added_fuel
            player.position.tank_level = min(new_level, GameConfig.FUEL_TANK_SIZE)
            player.position.timestamp = timestamp_now()

            self.broadcast_event(event=EventFactory.player_updated_event(player=player))

        player.is_refueling = False
        self.send_event(event=EventFactory.refueling_stopped_event(airport=airport, player=player), player=player)
        self.send_event(event=EventFactory.player_position_updated_event(player=player), player=player)

    def handle_player_position_update_request_event(self, player: Player, event: Event):
        logging.info(f"handle_player_position_update_request_event {player.id} {event}")
        data_model = PlayerPositionUpdateRequest(**event.data)
        self.update_player_position(
            player=player,
            timestamp=data_model.timestamp,
            bearing=data_model.bearing,
            velocity=data_model.velocity,
        )

    def handle_airport_landing(self, player: Player, airport: Airport):
        airport.land_player(player=player)

        self.broadcast_event(event=EventFactory.airport_updated_event(airport=airport))
        self.broadcast_event(event=EventFactory.player_position_updated_event(player=player))

    def handle_airport_departure(self, player: Player, airport: Airport):
        airport.remove_player(player=player)

        self.broadcast_event(event=EventFactory.airport_updated_event(airport=airport))
        self.broadcast_event(event=EventFactory.player_position_updated_event(player=player))

    def handle_shipment_dispatch(self, airport: Airport, player: Player, shipment_id: uuid.UUID):
        airport.dispatch_shipment(shipment_id=shipment_id, player=player)

        self.broadcast_event(event=EventFactory.player_updated_event(player=player))
        self.broadcast_event(event=EventFactory.airport_updated_event(airport=airport))

    def handle_shipment_delivery(self, airport: Airport, player: Player):
        shipment = airport.accept_shipment_delivery(player=player)
        self._shipments.pop(shipment.id)

        self.send_event(event=EventFactory.shipment_delivered_event(shipment=shipment), player=player)
        self.broadcast_event(event=EventFactory.player_updated_event(player=player))

    def handle_airport_landing_request_event(self, player: Player, event: Event):
        logging.info(f"handle_airport_landing_request_event {player.id} {event}")
        data_model = AirportRequest(**event.data)

        airport: Airport = self._airports.get(data_model.id)
        if not airport:
            raise InvalidAirport
        self.handle_airport_landing(player=player, airport=airport)

    def handle_airport_departure_request_event(self, player: Player, event: Event):
        logging.info(f"handle_airport_departure_request_event {player.id} {event}")
        data_model = AirportRequest(**event.data)

        airport: Airport = self._airports.get(data_model.id)
        if not airport:
            raise InvalidAirport
        self.handle_airport_departure(player=player, airport=airport)

    def handle_shipment_dispatch_request_event(self, player: Player, event: Event):
        logging.info(f"handle_shipment_dispatch_request_event {player.id} {event}")
        data_model = ShipmentRequest(**event.data)

        if not player.is_grounded:
            raise ShipmentOperationWhenFlying

        airport: Airport = self._airports.get(player.airport_id)
        self.handle_shipment_dispatch(player=player, airport=airport, shipment_id=data_model.id)

    def handle_shipment_delivery_request_event(self, player: Player, event: Event):
        logging.info(f"handle_shipment_delivery_request_event {player.id} {event}")

        if not player.is_grounded:
            raise ShipmentOperationWhenFlying

        airport: Airport = self._airports.get(player.airport_id)
        self.handle_shipment_delivery(player=player, airport=airport)

    def handle_refueling_start_request_event(self, player: Player, event: Event):
        logging.info(f"handle_refueling_start_request_event {player.id} {event}")

        if not player.is_grounded:
            raise RefuelingWhenFlying

        airport: Airport = self._airports.get(player.airport_id)

        t = threading.Thread(target=self.refuel_player, args=(player, airport))
        t.start()

    def handle_refueling_end_request_event(self, player: Player, event: Event):
        logging.info(f"handle_refueling_end_request_event {player.id} {event}")

        if not player.is_grounded:
            raise RefuelingWhenFlying

        player.is_refueling = False

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

        if event.type == EventType.AIRPORT_REFUELING_START_REQUEST:
            self.handle_refueling_start_request_event(player=player, event=event)
            return

        if event.type == EventType.AIRPORT_REFUELING_END_REQUEST:
            self.handle_refueling_end_request_event(player=player, event=event)
            return
