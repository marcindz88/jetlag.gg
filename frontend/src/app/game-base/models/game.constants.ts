import { calculateCircumference } from '../utils/geo-utils';
import { PlaneState } from './game.types';

export const EARTH_RADIUS = 40;
export const REAL_EARTH_RADIUS = 6371; // km
export const MAP_SCALE = EARTH_RADIUS / REAL_EARTH_RADIUS;

export const FLIGHT_ALTITUDE = 200 * MAP_SCALE;
export const CAMERA_ALTITUDE = FLIGHT_ALTITUDE + 10;

export const MOVING_RADIUS = EARTH_RADIUS + FLIGHT_ALTITUDE;

export const MOVING_CIRCUMFERENCE = calculateCircumference(MOVING_RADIUS);

// km/h
export const VELOCITY = {
  min: 0,
  max: 10000000,
  step: 50000,
  default: 2500000,
};

// deg
export const BEARING = {
  min: 0,
  max: 360,
  step: 1,
  default: 180,
};

export const DEFAULT_PLANE_STATE: PlaneState = {
  initialPoint: { lat: 52.22135563657265, lon: 21.008107155957713 },
  velocity: VELOCITY.default,
  bearing: BEARING.default,
};
