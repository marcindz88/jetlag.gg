import { Shipment } from '@pg/game-base/airports/models/airport.types';
import { GeoLocationPoint } from '@pg/game-base/models/game.types';

export type BasePlayer = {
  id: string;
  nickname: string;
};

export type OtherPlayer = {
  connected: boolean;
  color: string;
  position: PlanePosition;
  is_grounded: boolean;
  is_bot: boolean;
  shipment: Shipment | null;
  score: number;
  death_cause?: DeathCauseEnum;
} & BasePlayer;

export type PlayerList = {
  players: OtherPlayer[];
};

export type PartialPlayerData = Omit<Partial<OtherPlayer>, 'id'>;

export type PartialPlayerWithId = Omit<Partial<OtherPlayer>, 'id'> & Pick<OtherPlayer, 'id'>;

export type PlanePosition = {
  coordinates: GeoLocationPoint;
  bearing: number;
  velocity: number;
  timestamp: number;
  tank_level: number;
  fuel_consumption: number;
};

export type PlayerPositionUpdate = {
  id: string;
  position: PlanePosition;
  is_grounded?: boolean;
};

export enum DeathCauseEnum {
  RUN_OUT_OF_FUEL = 'run_out_of_fuel',
  SPEED_TOO_LOW = 'speed_too_low',
}

export enum PlayerUpdateType {
  VELOCITY = 'VELOCITY',
  BEARING = 'BEARING',
  BEFORE_CRASH = 'BEFORE_CRASH',
  DESTROY = 'DESTROY',
  SHIPMENT = 'SHIPMENT',
  GROUNDED = 'GROUNDED',
  POSITION = 'POSITION',
  FUEL_LEVEL = 'FUEL_LEVEL',
}
