import { DirectionEnum } from './game.enums';

export type GeoLocationPoint = {
  lat: number;
  long: number;
}

export type PlaneState = {
  initialPoint: GeoLocationPoint,
  speed: number,
  direction: DirectionEnum
}
