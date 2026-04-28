from math import radians, sin, cos, sqrt, atan2
from app.models.schemas import Location


class MapsService:
    @staticmethod
    def calculate_distance_km(source: Location, destination: Location) -> float:
        earth_radius_km = 6371.0
        dlat = radians(destination.lat - source.lat)
        dlng = radians(destination.lng - source.lng)
        lat1 = radians(source.lat)
        lat2 = radians(destination.lat)

        a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlng / 2) ** 2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return round(earth_radius_km * c, 3)
