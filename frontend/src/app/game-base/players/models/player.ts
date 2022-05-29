import { Shipment } from '@pg/game-base/airports/models/airport.types';
import { FLIGHT_ALTITUDE, VELOCITY } from '@pg/game-base/constants/game.constants';
import { getRandomColorFromNickname } from '@pg/game-base/utils/color-utils';
import {
  calculateBearingFromDirectionAndRotation,
  calculatePositionAfterTimeInterval,
  transformCoordinatesIntoPoint,
  transformPointAndDirectionIntoRotation,
  transformPointIntoCoordinates,
} from '@pg/game-base/utils/geo-utils';
import { ClockService } from '@shared/services/clock.service';
import { Subject } from 'rxjs';
import { Color, Euler, Object3D, Vector3 } from 'three';
import { degToRad } from 'three/src/math/MathUtils';

import { OtherPlayer, PartialPlayerData, PlanePosition } from './player.types';

export class Player {
  readonly id: string;
  readonly nickname: string;
  readonly color: Color;

  score: number;
  connected: boolean;
  isFocused = false;
  isGrounded = false;
  shipment: null | Shipment = null;

  planeObject?: Object3D;
  cartesianPosition!: Vector3;
  cartesianRotation!: Euler;

  velocity!: number;
  lastChangeTimestamp: number | null = null;

  flightParametersChanged$ = new Subject<void>();

  constructor(player: OtherPlayer, private clockService: ClockService) {
    this.id = player.id;
    this.nickname = player.nickname;
    this.connected = player.connected;
    this.score = player.score;
    this.isGrounded = player.is_grounded;
    this.shipment = player.shipment;
    this.color = new Color(getRandomColorFromNickname(this.nickname));

    this.position = player.position;
  }

  set position(position: PlanePosition) {
    if (this.lastChangeTimestamp && this.lastChangeTimestamp > position.timestamp) {
      // Ignore position update if locally was updated before or messages came out of order
      return;
    }
    this.lastChangeTimestamp = this.clockService.getCurrentTime();
    const updatedPosition = calculatePositionAfterTimeInterval(position, FLIGHT_ALTITUDE, this.lastChangeTimestamp);

    this.cartesianPosition = transformCoordinatesIntoPoint(updatedPosition.coordinates, FLIGHT_ALTITUDE);
    this.cartesianRotation = transformPointAndDirectionIntoRotation(
      updatedPosition.coordinates,
      updatedPosition.bearing
    );
    this.velocity = updatedPosition.velocity;
  }

  get position(): PlanePosition {
    if (!this.planeObject) {
      throw Error('Plane is not yet rendered cannot obtain position');
    }
    const timestamp = this.clockService.getCurrentTime();
    const position = this.planeObject.position.clone();
    const rotation = this.planeObject.rotation.clone();

    const coordinates = transformPointIntoCoordinates(position);
    const velocity = this.velocity;
    const bearing = calculateBearingFromDirectionAndRotation(rotation);

    return { coordinates, bearing, velocity, timestamp };
  }

  updatePlayer(playerData: PartialPlayerData) {
    if (playerData.position) {
      this.position = playerData.position;
    }
    if ('connected' in playerData) {
      this.connected = !!playerData.connected;
    }
    if ('is_grounded' in playerData) {
      this.isGrounded = !!playerData.is_grounded;
    }
    if ('shipment' in playerData) {
      this.shipment = playerData.shipment || null;
    }
    if ('score' in playerData) {
      this.score = playerData.score!;
    }
  }

  updateBearing(bearingChange: number) {
    this.planeObject!.rotation.z += degToRad(bearingChange);
    this.lastChangeTimestamp = this.clockService.getCurrentTime();
    this.flightParametersChanged$.next();
  }

  updateVelocity(velocityChange: number) {
    const velocity = this.velocity + velocityChange;
    if (velocity >= VELOCITY.min && velocity <= VELOCITY.max) {
      this.velocity = velocity;
      this.lastChangeTimestamp = this.clockService.getCurrentTime();
      this.flightParametersChanged$.next();
    }
  }
}
