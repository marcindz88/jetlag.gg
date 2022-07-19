import dataclasses


@dataclasses.dataclass
class GameConfig:
    MAX_PLAYERS: int = 16
    PLAYER_TIME_TO_CONNECT: int = 10000  # 10 seconds
    MAX_SHIPMENTS_IN_GAME: int = 60
    MIN_VELOCITY: int = 0
    MAX_VELOCITY: int = 2_000_000  # 2M km/h
    FLYING_VELOCITY: int = 50_000  # velocity under which plane will crash
    AIRPORT_MAXIMUM_DISTANCE_TO_LAND: int = 500  # 500km
    EARTH_RADIUS: float = 6371.0
    FLIGHT_ALTITUDE: float = 200.0
    FUEL_TANK_SIZE: int = 100_000  # 100k liters
    REFUELING_RATE: float = 3500  # liters per second

    @staticmethod
    def serialized():
        return dataclasses.asdict(GameConfig())
