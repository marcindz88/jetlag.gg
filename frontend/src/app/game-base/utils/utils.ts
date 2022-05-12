import { GeoLocationPoint } from './models/game.types';
import { Vector3 } from 'three/src/math/Vector3';
import { degToRad, radToDeg } from 'three/src/math/MathUtils';
import { NgtVector3 } from '@angular-three/core';
import { Euler } from 'three';

export const calculateCircumference = (radius: number) => 2 * Math.PI * radius;

export const transformPointIntoCoordinates = (vector: Vector3): GeoLocationPoint => {
  return {
    lat: radToDeg(Math.atan2(vector.y, Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.z, 2)))),
    lon: -radToDeg(Math.atan2(vector.z, vector.x)),
  };
};

export const transformCoordinatesIntoPoint = (point: GeoLocationPoint, radius: number): NgtVector3 => {
  const latRad = degToRad(point.lat);
  const longRad = degToRad(point.lon);
  return [
    Math.cos(latRad) * Math.cos(longRad) * radius,
    Math.sin(latRad) * radius,
    -Math.cos(latRad) * Math.sin(longRad) * radius,
  ];
};

export const transformPointAndDirectionIntoRotation = (point: GeoLocationPoint, direction: number): Euler =>
  new Euler(degToRad(point.lat), degToRad(270 + point.lon), degToRad(direction - 180), 'YXZ');
