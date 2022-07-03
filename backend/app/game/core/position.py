import random

from app.game.config import GameConfig
from app.game.core.coordinates import Coordinates
from app.tools.timestamp import timestamp_now


class PlayerPosition:
    coordinates: "Coordinates"
    bearing: float
    velocity: int  # km/h
    timestamp: int

    def __init__(
        self,
        coordinates: "Coordinates",
        bearing: float,
        velocity: int,
        timestamp: int,
        tank_level: float = GameConfig.FUEL_TANK_SIZE,
    ):
        self.coordinates = coordinates
        self.bearing = bearing
        self.velocity = velocity
        self.timestamp = timestamp
        self.tank_level = tank_level

    def future_tank_level(self, timestamp: int) -> float:
        timestamp_delta = timestamp - self.timestamp
        new_tank_level = self.tank_level - timestamp_delta * self.fuel_consumption / 3_600_000
        new_tank_level = max(new_tank_level, 0)
        return new_tank_level

    def future_position(self, timestamp: int, calculate_bearing: bool = False) -> "PlayerPosition":
        timestamp_delta = timestamp - self.timestamp
        distance_traveled = self.velocity * timestamp_delta / 3_600_000  # s = v*t, convert timestamp to hours
        future_coordinates = self.coordinates.destination_coordinates(distance=distance_traveled, bearing=self.bearing)
        if calculate_bearing:
            bearing_diff = (
                Coordinates.bearing_between(future_coordinates, self.coordinates) - 180
            ) % 360 - Coordinates.bearing_between(self.coordinates, future_coordinates)
            future_bearing = self.bearing + bearing_diff
        else:
            future_bearing = self.bearing

        return PlayerPosition(
            coordinates=future_coordinates,
            bearing=future_bearing,
            velocity=self.velocity,
            timestamp=timestamp,
            tank_level=self.future_tank_level(timestamp=timestamp),
        )

    @staticmethod
    def random() -> "PlayerPosition":
        return PlayerPosition(
            coordinates=Coordinates(
                latitude=random.uniform(-90, 90),
                longitude=random.uniform(-180, 180),
            ),
            bearing=random.uniform(0, 359),
            velocity=500_000,
            timestamp=timestamp_now(),
        )

    @property
    def fuel_consumption(self) -> int:
        # todo cleanup & simplify
        # in liters per hour
        max_velocity = GameConfig.MAX_VELOCITY
        upper_limit = 15
        lower_limit = 2

        if self.velocity == 0:
            return 0

        scaled_down_velocity = (self.velocity / (max_velocity / (upper_limit - lower_limit))) + lower_limit

        coefficient = 0.28
        consumption = 2 ** (coefficient * scaled_down_velocity)

        consumption = consumption * 43

        # scaling to liters per hour
        consumption = consumption * 60 * 60
        return int(consumption)

    @property
    def serialized(self) -> dict:
        return {
            "coordinates": self.coordinates.serialized,
            "velocity": self.velocity,
            "fuel_consumption": self.fuel_consumption,
            "tank_level": self.tank_level,
            "bearing": self.bearing,
            "timestamp": self.timestamp,
        }
