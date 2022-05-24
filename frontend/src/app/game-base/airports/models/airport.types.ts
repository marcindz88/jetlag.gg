import { Airport } from '@pg/game-base/airports/models/airport';
import { GeoLocationPoint } from '@pg/game-base/models/game.types';

export type Shipment = {
  id: string;
  name: string;
  award: number;
  destination_id: string;
  valid_till?: number;
};

export interface AirportType {
  id: string;
  name: string;
  coordinates: GeoLocationPoint;
  occupying_player_id: string;
  shipments: Shipment[];
}

export type AirportList = {
  airports: AirportType[];
};

export type AirportUpdate = {
  id: string;
  occupying_player_id: string;
};

export type AirPortsMap = Map<string, Airport>;

export type NearAirport = { airport: Airport; distance: number };
export type NearAirportsList = NearAirport[];
