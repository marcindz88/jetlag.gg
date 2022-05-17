import { NgtRenderState } from '@angular-three/core';
import { Object3D } from 'three';

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

export type BeforeRenderedObject = { state: NgtRenderState; object: Object3D };
