import { PlaneState } from './game.types';
import { DirectionEnum } from './game.enums';

export const EARTH_RADIUS = 40;

export const DEFAULT_PLANE_STATE: PlaneState = {
  initialPoint: { lat: 0, long: 0 },
  speed: 2,
  direction: DirectionEnum.FORWARD
};
