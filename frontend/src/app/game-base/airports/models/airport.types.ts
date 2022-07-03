import { Airport } from '@pg/game-base/airports/models/airport';
import { GeoLocationPoint } from '@pg/game-base/models/game.types';

export type Shipment = {
  id: string;
  name: string;
  award: number;
  destination_id: string;
  valid_till: number;
};

export interface AirportType {
  id: string;
  name: string;
  full_name: string;
  description: string;
  elevation: number;
  coordinates: GeoLocationPoint;
  occupying_player: string;
  fuel_price: number;
  shipments: Shipment[];
}

export type AirportList = {
  airports: AirportType[];
};

export type AirportUpdate = {
  id: string;
  occupying_player: string;
  shipments: Shipment[];
};

export type AirportRequest = {
  id: string;
};

export type AirPortsMap = Map<string, Airport>;

export type NearAirportsList = Airport[];
