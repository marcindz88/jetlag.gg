import { PlaneState } from './game.types';

export const EARTH_RADIUS = 40;
export const REAL_EARTH_RADIUS = 6371; // km
export const MAP_SCALE = EARTH_RADIUS / REAL_EARTH_RADIUS;

export const FLIGHT_ALTITUDE = 100 * (EARTH_RADIUS / REAL_EARTH_RADIUS);

// km/h
export const SPEED = {
  min: 1000,
  max: 100000,
  step: 500,
  default: 10000,
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
  velocity: SPEED.default,
  bearing: BEARING.default,
};
