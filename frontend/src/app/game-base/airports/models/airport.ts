import { AirportType, AirportUpdate, Shipment } from '@pg/game-base/airports/models/airport.types';
import { AIRPORT_ALTITUDE } from '@pg/game-base/constants/game.constants';
import { GeoLocationPoint } from '@pg/game-base/models/game.types';
import { transformCoordinatesIntoPoint, transformPointAndDirectionIntoRotation } from '@pg/shared/utils/geo-utils';
import { Euler, Vector3 } from 'three';

export class Airport implements AirportType {
  readonly id: string;
  readonly name: string;
  readonly coordinates: GeoLocationPoint;
  occupying_player_id: string;
  shipments: Shipment[];
  cartesianPosition!: Vector3;
  cartesianRotation!: Euler;

  constructor(airport: AirportType) {
    this.id = airport.id;
    this.name = airport.name;
    this.coordinates = airport.coordinates;
    this.cartesianPosition = transformCoordinatesIntoPoint(airport.coordinates, AIRPORT_ALTITUDE);
    this.cartesianRotation = transformPointAndDirectionIntoRotation(airport.coordinates, 0);
    this.occupying_player_id = airport.occupying_player_id;
    this.shipments = airport.shipments || [];
  }

  updateAirport(airportUpdate: AirportUpdate) {
    this.occupying_player_id = airportUpdate.occupying_player_id;
  }
}
