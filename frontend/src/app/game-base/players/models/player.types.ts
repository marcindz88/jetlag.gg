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
