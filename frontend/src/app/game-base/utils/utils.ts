import { NgtTriple } from '@angular-three/core/lib/types';
import { Euler } from 'three';
import { degToRad, radToDeg } from 'three/src/math/MathUtils';

import { GeoLocationPoint } from '../models/game.types';

export const calculateCircumference = (radius: number) => 2 * Math.PI * radius;

export const transformPointIntoCoordinates = ([x, y, z]: NgtTriple): GeoLocationPoint => {
  return {
    lat: radToDeg(Math.atan2(y, Math.sqrt(Math.pow(x, 2) + Math.pow(z, 2)))),
    lon: -radToDeg(Math.atan2(z, x)),
  };
};

export const transformCoordinatesIntoPoint = (point: GeoLocationPoint, radius: number): NgtTriple => {
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
