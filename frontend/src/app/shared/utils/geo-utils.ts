import { EARTH_RADIUS, MAP_SCALE } from '@pg/game-base/constants/game.constants';
import { GeoLocationPoint } from '@pg/game-base/models/game.types';
import { PlanePosition } from '@pg/game-base/players/models/player.types';
import { Euler, Spherical, Vector3 } from 'three';
import { degToRad, radToDeg } from 'three/src/math/MathUtils';

const convertLocationPointToRad = (point: GeoLocationPoint): GeoLocationPoint => ({
  lat: degToRad(point.lat),
  lon: degToRad(point.lon),
});

const arePointsEqual = (start: GeoLocationPoint, end: GeoLocationPoint) => {
  return Math.abs(start.lat - end.lat) < 0.00000001 && Math.abs(start.lon - end.lon) < 0.00000001;
};

export const normalizeBearing = (bearing: number) => {
  return bearing < 0 ? bearing + 360 : bearing;
};

export const transformPointIntoCoordinates = (vector: Vector3): GeoLocationPoint => {
  const spherical = new Spherical().setFromVector3(vector);
  return {
    lat: -(radToDeg(spherical.phi) - 90),
    lon: radToDeg(spherical.theta) - 90,
  };
};

export const transformCoordinatesIntoPoint = (point: GeoLocationPoint, altitude: number): Vector3 => {
  const vector = new Vector3().setFromSphericalCoords(
    EARTH_RADIUS + altitude,
    degToRad(point.lat + 90),
    degToRad(point.lon + 90)
  );
  return new Vector3(vector.x, -vector.y, vector.z);
};

export const transformPointAndDirectionIntoRotation = (point: GeoLocationPoint, bearing: number): Euler => {
  return new Euler(degToRad(point.lat), degToRad(270 + point.lon), degToRad(bearing), 'YXZ');
};

export const calculateBearingFromDirectionAndRotation = (rotation: Euler) => {
  return normalizeBearing(radToDeg(rotation.z));
};

export const calculateBearingBetweenPoints = (start: GeoLocationPoint, end: GeoLocationPoint) => {
  const { lon: lon1, lat: lat1 } = convertLocationPointToRad(start);
  const { lon: lon2, lat: lat2 } = convertLocationPointToRad(end);

  const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360; // in degrees
};

export const calculateBearingDisplacementBetweenCoordinates = (start: GeoLocationPoint, end: GeoLocationPoint) => {
  return arePointsEqual(start, end)
    ? 0
    : ((calculateBearingBetweenPoints(end, start) - 180) % 360) - calculateBearingBetweenPoints(start, end);
};

export const calculatePositionAfterTimeInterval = (
  position: PlanePosition,
  altitude: number,
  currentTimestamp: number
): PlanePosition => {
  const distance = (position.velocity * MAP_SCALE * (currentTimestamp - position.timestamp)) / 3600000;

  const r = EARTH_RADIUS + altitude;
  const bearing = degToRad(position.bearing);

  const { lat: lat1, lon: lon1 } = convertLocationPointToRad(position.coordinates);

  const cos_lat1 = Math.cos(lat1);
  const sin_lat1 = Math.sin(lat1);
  const cos_dr = Math.cos(distance / r);
  const sin_dr = Math.sin(distance / r);

  const lat2 = Math.asin(sin_lat1 * cos_dr + cos_lat1 * sin_dr * Math.cos(bearing));
  const lon2 = lon1 + Math.atan2(Math.sin(bearing) * sin_dr * cos_lat1, cos_dr - sin_lat1 * Math.sin(lat2));

  const newPosition: GeoLocationPoint = {
    lat: radToDeg(lat2),
    lon: radToDeg(lon2),
  };

  const newBearing = normalizeBearing(
    position.bearing + calculateBearingDisplacementBetweenCoordinates(position.coordinates, newPosition)
  );

  return {
    coordinates: newPosition,
    bearing: newBearing,
    velocity: position.velocity,
    timestamp: currentTimestamp,
  };
};
