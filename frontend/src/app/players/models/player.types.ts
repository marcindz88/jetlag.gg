export type BasePlayer = {
  id: string;
  nickname: string;
  position: PlanePosition;
};

export type MyPlayer = {
  token: string;
} & BasePlayer;

export type OtherPlayer = {
  connected: string;
} & BasePlayer;

export type PartialPlayerWithId = Omit<Partial<OtherPlayer>, 'id'> & Pick<OtherPlayer, 'id'>;

export type PlanePosition = {
  bearing: number;
  lat: number;
  lon: number;
  timestamp: number;
  velocity: number;
};

export type PlayerPositionUpdate = {
  id: string;
  position: PlanePosition;
};
