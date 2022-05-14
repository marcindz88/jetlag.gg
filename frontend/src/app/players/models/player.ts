import { MOVING_RADIUS, VELOCITY } from '@pg/game-base/models/game.constants';
import {
  calculateBearingDisplacementFromCoordinates,
  transformCoordinatesIntoPoint,
  transformPointAndDirectionIntoRotation,
  transformPointIntoCoordinates,
} from '@pg/game-base/utils/utils';
import { Subject } from 'rxjs';
import { Euler, Vector3 } from 'three';
import { degToRad, radToDeg } from 'three/src/math/MathUtils';

import { OtherPlayer, PartialPlayerData, PlanePosition } from './player.types';

export class Player {
  readonly id: string;
  readonly nickname: string;

  connected: string;

  cartesianPosition!: Vector3;
  cartesianRotation!: Euler;
  velocity!: number;

  flightParametersChanged$ = new Subject<void>();

  constructor(player: OtherPlayer) {
    this.id = player.id;
    this.nickname = player.nickname;
    this.connected = player.connected;

    this.position = player.position;
  }

  set position(position: PlanePosition) {
    this.cartesianPosition = transformCoordinatesIntoPoint(position.coordinates, MOVING_RADIUS);
    this.cartesianRotation = transformPointAndDirectionIntoRotation(position.coordinates, position.bearing);
    this.velocity = position.velocity;
  }

  get position() {
    const coordinates = transformPointIntoCoordinates(this.cartesianPosition);
    let bearing = radToDeg(this.cartesianRotation.z) + calculateBearingDisplacementFromCoordinates(coordinates);
    bearing = bearing > 0 ? bearing : 360 + bearing;
    return {
      coordinates,
      bearing: bearing,
      velocity: this.velocity,
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
