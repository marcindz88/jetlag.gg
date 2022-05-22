import { GeoLocationPoint } from '@pg/game-base/models/game.types';

export type BasePlayer = {
  id: string;
  nickname: string;
};

export type OtherPlayer = {
  connected: string;
  position: PlanePosition;
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
};

export type PlayerPositionUpdate = {
  id: string;
  position: PlanePosition;
};
