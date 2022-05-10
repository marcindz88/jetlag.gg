import { PlaneState } from './game.types';

export const EARTH_RADIUS = 40;
export const REAL_EARTH_RADIUS = 6371; // km
export const MAP_SCALE = EARTH_RADIUS / REAL_EARTH_RADIUS / 5000;

export const FLIGHT_ALTITUDE = 100 * (EARTH_RADIUS / REAL_EARTH_RADIUS);

// km/h
export const SPEED = {
  min: 100,
  max: 10000,
  step: 50,
  default: 1000,
};

// deg
export const DIRECTION = {
  min: 0,
  max: 360,
  step: 2,
  default: 180,
};

export const DEFAULT_PLANE_STATE: PlaneState = {
  initialPoint: { lat: 52.22135563657265, long: 21.008107155957713 },
  speed: SPEED.default,
  direction: DIRECTION.default,
};
