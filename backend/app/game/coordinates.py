from math import sin, cos, sqrt, atan2, radians, degrees, asin


class Coordinates:
    latitude: float
    longitude: float
    EARTH_RADIUS: float = 6371.0
    FLIGHT_ALTITUDE: float = 200.0

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
        a = sin(delta_lat/2)**2 + cos(lat1)*cos(lat2)*sin(delta_lon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))
        d = Coordinates._earth_radius() * c
        return d

    def destination_coordinates(self, distance: int, bearing: float) -> "Coordinates":
        # https://stackoverflow.com/a/7835325
        r = self._earth_radius()
        bearing = radians(bearing)

        lat1 = radians(self.latitude)
        lon1 = radians(self.longitude)

        lat2 = asin(
            sin(lat1) * cos(distance / r) + cos(lat1) * sin(distance / r) * cos(bearing)
        )

        lon2 = lon1 + atan2(
            sin(bearing) * sin(distance / r) * cos(lat1),
            cos(distance / r) - sin(lat1) * sin(lat2),
        )

        lat2 = degrees(lat2)
        lon2 = degrees(lon2)

        return Coordinates(latitude=lat2, longitude=lon2)
