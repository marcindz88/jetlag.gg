export type GeoLocationPoint = {
  lat: number;
  lon: number;
};

export type PlaneState = {
  initialPoint: GeoLocationPoint;
  velocity: number;
  bearing: number;
};

export type PlaneStateUpdateRequest = {
  bearing: number;
  velocity: number;
  timestamp: number;
};
