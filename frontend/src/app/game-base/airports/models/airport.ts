import { AirportType, AirportUpdate, Shipment } from '@pg/game-base/airports/models/airport.types';
import { AIRPORT_ALTITUDE, NEARBY_AIRPORT_DISTANCE } from '@pg/game-base/constants/game.constants';
import { GeoLocationPoint } from '@pg/game-base/models/game.types';
import {
  calculateDistanceBetweenPoints,
  transformCoordinatesIntoPoint,
  transformPointAndDirectionIntoRotation,
} from '@pg/game-base/utils/geo-utils';
import { BehaviorSubject, Subject } from 'rxjs';
import { Euler, Vector3 } from 'three';

export class Airport implements AirportType {
  readonly id: string;
  readonly name: string;
  readonly coordinates: GeoLocationPoint;
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
    this.coordinates = airport.coordinates;
    this.cartesianPosition = transformCoordinatesIntoPoint(airport.coordinates, AIRPORT_ALTITUDE);
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
      this.isClosest && this.distance < NEARBY_AIRPORT_DISTANCE && !this.occupying_player
    );
  }
}
