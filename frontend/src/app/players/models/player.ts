import { FLIGHT_ALTITUDE, VELOCITY } from '@pg/game-base/models/game.constants';
import {
  calculateBearingFromPointAndCurrentRotation,
  calculatePositionAfterTimeInterval,
  transformCoordinatesIntoPoint,
  transformPointAndDirectionIntoRotation,
  transformPointIntoCoordinates,
} from '@pg/game-base/utils/geo-utils';
import { ClockService } from '@shared/services/clock.service';
import { Subject } from 'rxjs';
import { Euler, Vector3 } from 'three';
import { degToRad } from 'three/src/math/MathUtils';

import { OtherPlayer, PartialPlayerData, PlanePosition } from './player.types';

export class Player {
  readonly id: string;
  readonly nickname: string;

  connected: string;

  cartesianPosition!: Vector3;
  cartesianRotation!: Euler;
  velocity!: number;

  flightParametersChanged$ = new Subject<void>();

  constructor(player: OtherPlayer, private clockService: ClockService) {
    this.id = player.id;
    this.nickname = player.nickname;
    this.connected = player.connected;

    this.position = player.position;
  }

  set position(position: PlanePosition) {
    const updatedPosition = calculatePositionAfterTimeInterval(
      position,
      FLIGHT_ALTITUDE,
      this.clockService.getCurrentTime()
    );
    this.cartesianPosition = transformCoordinatesIntoPoint(updatedPosition.coordinates, FLIGHT_ALTITUDE);
    this.cartesianRotation = transformPointAndDirectionIntoRotation(
      updatedPosition.coordinates,
      updatedPosition.bearing
    );
    this.velocity = updatedPosition.velocity;
  }

  get position(): PlanePosition {
    const coordinates = transformPointIntoCoordinates(this.cartesianPosition);
    const bearing = calculateBearingFromPointAndCurrentRotation(coordinates, this.cartesianRotation);
    return {
      coordinates,
      bearing,
      velocity: this.velocity,
      timestamp: this.clockService.getCurrentTime(),
    };
  }

  updatePlayer(playerData: PartialPlayerData) {
    if (playerData.connected) {
      this.connected = playerData.connected;
    }
    if (playerData.position) {
      this.position = playerData.position;
    }
  }

  updateBearing(bearingChange: number) {
    this.cartesianRotation.z = this.cartesianRotation.z + degToRad(bearingChange);
    this.flightParametersChanged$.next();
  }

  updateVelocity(velocityChange: number) {
    const velocity = this.velocity + velocityChange;
    if (velocity >= VELOCITY.min && velocity <= VELOCITY.max) {
      this.velocity = velocity;
      this.flightParametersChanged$.next();
    }
  }
}
