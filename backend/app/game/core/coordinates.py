from math import sin, cos, sqrt, atan2, radians, degrees, asin, pi

from app.game.config import GameConfig


class Coordinates:
    latitude: float
    longitude: float
    EARTH_RADIUS: float = GameConfig.EARTH_RADIUS
    FLIGHT_ALTITUDE: float = GameConfig.FLIGHT_ALTITUDE

    def __init__(self, latitude: float, longitude: float):
        self.latitude = latitude
        self.longitude = longitude

    @property
    def serialized(self) -> dict:
        return {
            "lat": self.latitude,
            "lon": self.longitude,
        }

    @classmethod
    def _earth_radius(cls) -> float:
        return cls.EARTH_RADIUS + cls.FLIGHT_ALTITUDE

    @staticmethod
    def distance_between(coord1: "Coordinates", coord2: "Coordinates") -> float:
        """
        Haversine formula:
        a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
        c = 2 ⋅ atan2( √a, √(1−a) )
        d = R ⋅ c
        where φ is latitude, λ is longitude, R is earth’s radius
        note that angles need to be in radians to pass to trig functions!
        """
        lat1 = radians(coord1.latitude)
        lon1 = radians(coord1.longitude)
        lat2 = radians(coord2.latitude)
        lon2 = radians(coord2.longitude)

        delta_lat = lat2 - lat1
        delta_lon = lon2 - lon1
        a = sin(delta_lat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(delta_lon / 2) ** 2
        c = 2 * atan2(sqrt(a), sqrt(max(1 - a, 0)))
        d = Coordinates._earth_radius() * c
        return d

    @staticmethod
    def bearing_between(coord1: "Coordinates", coord2: "Coordinates") -> float:
        lat1 = radians(coord1.latitude)
        lon1 = radians(coord1.longitude)
        lat2 = radians(coord2.latitude)
        lon2 = radians(coord2.longitude)

        y = sin(lon2 - lon1) * cos(lat2)
        x = cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(lon2 - lon1)

        return ((atan2(y, x) * 180) / pi + 360) % 360

    def destination_coordinates(self, distance: float, bearing: float) -> "Coordinates":
        # https://stackoverflow.com/a/7835325
        r = self._earth_radius()
        bearing = radians(bearing)

        lat1 = radians(self.latitude)
        lon1 = radians(self.longitude)

        cos_lat1 = cos(lat1)
        sin_lat1 = sin(lat1)
        cos_dr = cos(distance / r)
        sin_dr = sin(distance / r)

        lat2 = asin(sin_lat1 * cos_dr + cos_lat1 * sin_dr * cos(bearing))
        lon2 = lon1 + atan2(sin(bearing) * sin_dr * cos_lat1, cos_dr - sin_lat1 * sin(lat2))

        lat2 = degrees(lat2)
        lon2 = degrees(lon2)

        return Coordinates(latitude=lat2, longitude=lon2)
