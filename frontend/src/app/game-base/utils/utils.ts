import { EARTH_RADIUS } from '@pg/game-base/models/game.constants';
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
