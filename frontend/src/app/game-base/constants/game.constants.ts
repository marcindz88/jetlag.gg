import { PlaneState } from '../models/game.types';

export const EARTH_RADIUS = 40;
export const REAL_EARTH_RADIUS = 6371; // km
export const MAP_SCALE = EARTH_RADIUS / REAL_EARTH_RADIUS;

export const FLIGHT_ALTITUDE = 200 * MAP_SCALE;
export const AIRPORT_ALTITUDE = 80 * MAP_SCALE; // Upper end of tower

export const MOVING_RADIUS = EARTH_RADIUS + FLIGHT_ALTITUDE;
export const MOVING_CIRCUMFERENCE = 2 * Math.PI * MOVING_RADIUS;

export const NUMBER_OF_CLOSE_AIRPORTS = 6;
export const NEARBY_AIRPORT_DISTANCE = 500;
export const NEARBY_AIRPORT_SCALED_DISTANCE = NEARBY_AIRPORT_DISTANCE * MAP_SCALE;

export const CAMERA = {
  minHeight: EARTH_RADIUS + 1,
  maxHeight: EARTH_RADIUS + 20,
  defaultZoom: 1 / 3,
  zoomSpeed: 0.3,
  rotateSpeed: 0.3,
  cameraModes: 3,
};

export enum CameraModesEnum {
  FREE,
  FOLLOW,
  POSITION,
}

// km/h
export const VELOCITY = {
  min: 0,
  max: 2000000,
  step: 50000,
  default: 500000,
};

// deg
export const BEARING = {
  min: 0,
  max: 360,
  step: 2,
  default: 180,
};

export const DEFAULT_PLANE_STATE: PlaneState = {
  initialPoint: { lat: 52.22135563657265, lon: 21.008107155957713 },
  velocity: VELOCITY.default,
  bearing: BEARING.default,
};
