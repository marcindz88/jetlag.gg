import { PlaneState } from '../models/game.types';

export const EARTH_RADIUS = 40;
export const REAL_EARTH_RADIUS = 6371; // km
export const MAP_SCALE = EARTH_RADIUS / REAL_EARTH_RADIUS;

export const FLIGHT_ALTITUDE = 200 * MAP_SCALE;
export const AIRPORT_ALTITUDE = 80 * MAP_SCALE; // Upper end of tower
export const CAMERA_ALTITUDE = FLIGHT_ALTITUDE + 10;

export const MOVING_RADIUS = EARTH_RADIUS + FLIGHT_ALTITUDE;
export const MOVING_CIRCUMFERENCE = 2 * Math.PI * MOVING_RADIUS;

export const NUMBER_OF_CLOSE_AIRPORTS = 6;
export const NEARBY_AIRPORT_DISTANCE = 500;
export const NEARBY_AIRPORT_SCALED_DISTANCE = NEARBY_AIRPORT_DISTANCE * MAP_SCALE;

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
  step: 4,
  default: 180,
};

export const DEFAULT_PLANE_STATE: PlaneState = {
  initialPoint: { lat: 52.22135563657265, lon: 21.008107155957713 },
  velocity: VELOCITY.default,
  bearing: BEARING.default,
};
