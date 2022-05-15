import { EARTH_RADIUS, MAP_SCALE } from '@pg/game-base/models/game.constants';
import { PlanePosition } from '@pg/players/models/player.types';
import { Euler, Spherical, Vector3 } from 'three';
import { degToRad, radToDeg } from 'three/src/math/MathUtils';

import { GeoLocationPoint } from '../models/game.types';

export const calculateCircumference = (radius: number) => 2 * Math.PI * radius;

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

export const transformPointAndDirectionIntoRotation = (point: GeoLocationPoint, bearing: number): Euler =>
  new Euler(degToRad(point.lat), degToRad(270 + point.lon), degToRad(bearing), 'YXZ');

export const calculateBearingDisplacementFromCoordinates = (point: GeoLocationPoint) => {
  return Math.atan2(Math.sin(point.lon), -Math.sin(point.lat) * Math.cos(point.lon));
};

export const calculateBearingFromPointAndCurrentRotation = (point: GeoLocationPoint, rotation: Euler) => {
  const bearing = radToDeg(rotation.z) + calculateBearingDisplacementFromCoordinates(point);
  return bearing < 0 ? bearing + 360 : bearing;
};

export const calculatePositionAfterTimeInterval = (
  position: PlanePosition,
  altitude: number,
  currentTimestamp: number
): PlanePosition => {
  const distance = (position.velocity * MAP_SCALE * (currentTimestamp - position.timestamp)) / 3600000;

  const r = EARTH_RADIUS + altitude;
  const bearing = degToRad(position.bearing);

  const lat1 = degToRad(position.coordinates.lat);
  const lon1 = degToRad(position.coordinates.lon);

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
  const newBearing =
    position.bearing -
    calculateBearingDisplacementFromCoordinates(position.coordinates) +
    calculateBearingDisplacementFromCoordinates(newPosition);

  return {
    coordinates: newPosition,
    bearing: newBearing,
    velocity: position.velocity,
    timestamp: currentTimestamp,
  };
};