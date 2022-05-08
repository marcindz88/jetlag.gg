import { PlaneState } from './game.types';

export const EARTH_RADIUS = 40;

export const DEFAULT_PLANE_STATE: PlaneState = {
  initialPoint: { lat: 0, long: 0 },
  speed: 2,
  direction: 180
};
