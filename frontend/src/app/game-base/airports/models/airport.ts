import { AirportType, AirportUpdate, Shipment } from '@pg/game-base/airports/models/airport.types';
import { GeoLocationPoint } from '@pg/game-base/models/game.types';
import {
  calculateDistanceBetweenPoints,
  transformCoordinatesIntoPoint,
  transformPointAndDirectionIntoRotation,
} from '@pg/game-base/utils/geo-utils';
import { CONFIG } from '@shared/services/config.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { Euler, Vector3 } from 'three';

export class Airport implements AirportType {
  readonly id: string;
  readonly name: string;
  readonly full_name: string;
  readonly description: string;
  readonly elevation: number;
  readonly coordinates: GeoLocationPoint;
  readonly fuel_price: number;
  readonly changed$ = new Subject<void>();
  readonly isNearbyAndAvailable$ = new BehaviorSubject<boolean>(false);

  occupying_player: string;
  shipments: Shipment[];
  cartesianPosition!: Vector3;
  cartesianRotation!: Euler;
  isClosest = false;
  distance = Infinity;

  constructor(airport: AirportType) {
    this.id = airport.id;
    this.name = airport.name;
    this.full_name = airport.full_name;
    this.description = airport.description;
    this.elevation = airport.elevation;
    this.coordinates = airport.coordinates;
    this.fuel_price = airport.fuel_price;
    this.cartesianPosition = transformCoordinatesIntoPoint(
      airport.coordinates,
      0.5 + this.elevation * CONFIG.MAP_SCALE * 20 // due to increased displacement effect and not starting at 0
    );
    this.cartesianRotation = transformPointAndDirectionIntoRotation(airport.coordinates, 0);
    this.occupying_player = airport.occupying_player;
    this.shipments = airport.shipments || [];
  }

  updateAirport(airportUpdate: AirportUpdate) {
    this.occupying_player = airportUpdate.occupying_player;
    this.shipments = airportUpdate.shipments;
    this.updateIsNearbyAndAvailable();
    this.changed$.next();
  }

  updateDistance(point: GeoLocationPoint): Airport {
    this.distance = calculateDistanceBetweenPoints(this.coordinates, point);
    return this;
  }

  updateIsClosest(isClosest: boolean): Airport {
    this.isClosest = isClosest;
    this.updateIsNearbyAndAvailable();
    return this;
  }

  private updateIsNearbyAndAvailable() {
    this.isNearbyAndAvailable$.next(
      this.isClosest && this.distance < CONFIG.AIRPORT_MAXIMUM_DISTANCE_TO_LAND && !this.occupying_player
    );
  }
}
