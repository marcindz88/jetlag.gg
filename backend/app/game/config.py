import dataclasses


@dataclasses.dataclass
class GameConfig:
    MAX_PLAYERS: int = 16
    PLAYER_TIME_TO_CONNECT: int = 5000  # 5 seconds
    MAX_SHIPMENTS_IN_GAME: int = 40
    MIN_VELOCITY: int = 0
    MAX_VELOCITY: int = 2_000_000  # 2M km/h
    AIRPORT_MAXIMUM_DISTANCE_TO_LAND: int = 500  # 500km
    EARTH_RADIUS: float = 6371.0
    FLIGHT_ALTITUDE: float = 200.0

    @staticmethod
    def serialized():
        return dataclasses.asdict(GameConfig())
