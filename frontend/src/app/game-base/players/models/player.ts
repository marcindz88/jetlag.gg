import { Shipment } from '@pg/game-base/airports/models/airport.types';
import {
  calculateBearingFromDirectionAndRotation,
  calculatePositionAfterTimeInterval,
  transformCoordinatesIntoPoint,
  transformPointAndDirectionIntoRotation,
} from '@pg/game-base/utils/geo-utils';
import { determineNewVelocity } from '@pg/game-base/utils/velocity-utils';
import { ClockService } from '@shared/services/clock.service';
import { CONFIG } from '@shared/services/config.service';
import { filter, Subject, takeUntil, timer } from 'rxjs';
import { Color, Euler, Object3D, Vector3 } from 'three';
import { degToRad } from 'three/src/math/MathUtils';

import { DeathCauseEnum, OtherPlayer, PartialPlayerData, PlanePosition } from './player.types';

export class Player {
  readonly id: string;
  readonly nickname: string;
  readonly color: Color;

  score: number;
  connected: boolean;
  isFocused = false;
  isGrounded = false;
  isMyPlayer = false;
  isBot = false;
  isCrashing = false;
  isCrashed = false;
  deathCause?: DeathCauseEnum;

  shipment: null | Shipment = null;

  planeObject?: Object3D;
  initialPosition = new Vector3();
  cartesianPosition = new Vector3();
  initialRotation = new Euler();
  cartesianRotation = new Euler();

  changeNotifiers = {
    position$: new Subject<void>(),
    destroy$: new Subject<void>(),
    shipment$: new Subject<void>(),
    velocityOrBearing$: new Subject<void>(),
    blocked$: new Subject<void>(),
  };

  lastPosition!: PlanePosition;

  private fuelConsumption!: number;
  private lastInternalChangeTimestamp: number | null = null;

  constructor(player: OtherPlayer, isMyPlayer: boolean, private clockService: ClockService) {
    this.id = player.id;
    this.nickname = player.nickname;
    this.connected = player.connected;
    this.score = player.score;
    this.isGrounded = player.is_grounded;
    this.isMyPlayer = isMyPlayer;
    this.isBot = player.is_bot;
    this.shipment = player.shipment;
    this.color = new Color(player.color);

    this.setPositionFromEvent(player.position);
    this.setPositionUpdater();

    this.initialPosition = this.cartesianPosition;
    this.initialRotation = this.cartesianRotation;
  }

  get currentPosition(): PlanePosition {
    return calculatePositionAfterTimeInterval(
      this.lastPosition,
      CONFIG.FLIGHT_ALTITUDE_SCALED,
      this.clockService.getCurrentTime()
    );
  }

  updatePlayer(playerData: PartialPlayerData) {
    if ('connected' in playerData) {
      this.connected = !!playerData.connected;
    }
    if ('is_grounded' in playerData && playerData.is_grounded !== this.isGrounded) {
      this.isGrounded = !!playerData.is_grounded;
      this.changeNotifiers.blocked$.next();
    }
    if ('shipment' in playerData && playerData.shipment !== this.shipment) {
      this.shipment = playerData.shipment || null;
      this.changeNotifiers.shipment$.next();
    }
    if ('score' in playerData) {
      this.score = playerData.score!;
    }
    if (playerData.position) {
      this.setPositionFromEvent(playerData.position);
    }
    if (playerData.death_cause) {
      this.deathCause = playerData.death_cause;
      this.startCrashingPlane();
      this.changeNotifiers.blocked$.next();
    }
  }

  startCrashingPlane() {
    this.isCrashing = true;
  }

  endCrashingPlane() {
    this.isCrashed = true;
    this.isCrashing = false;
    this.destroy();
  }

  accelerate() {
    this.updateVelocity(true);
  }

  decelerate() {
    this.updateVelocity(false);
  }

  updateBearing(bearingChange: number) {
    if (this.isBlocked()) {
      return;
    }
    this.updateLastPositionAndAdjustPlane();
    this.cartesianRotation.z += degToRad(bearingChange);
    this.lastPosition.bearing = calculateBearingFromDirectionAndRotation(this.cartesianRotation);
    this.lastInternalChangeTimestamp = this.clockService.getCurrentTime();
    this.changeNotifiers.velocityOrBearing$.next();
  }

  isBlocked() {
    return this.isCrashed || this.isCrashing || this.isGrounded;
  }

  destroy() {
    this.changeNotifiers.blocked$.next();
    this.changeNotifiers.destroy$.next();
    Object.values(this.changeNotifiers).forEach(notifier => notifier.complete());
  }

  private updateVelocity(isAccelerate: boolean) {
    if (this.isBlocked()) {
      return;
    }

    const velocity = determineNewVelocity(this.lastPosition.velocity, isAccelerate);
    if (velocity !== this.lastPosition.velocity) {
      this.updateLastPosition();
      this.lastPosition.velocity = velocity;
      this.lastInternalChangeTimestamp = this.clockService.getCurrentTime();
      this.changeNotifiers.velocityOrBearing$.next();
    }
  }

  private setPositionFromEvent(position: PlanePosition) {
    if (this.lastInternalChangeTimestamp && this.lastInternalChangeTimestamp > position.timestamp && !this.isGrounded) {
      // Ignore position update if locally was updated before or messages came out of order
      return;
    }

    this.updateLastPositionAndAdjustPlane(position);
    this.lastInternalChangeTimestamp = this.lastPosition.timestamp;
    this.fuelConsumption = this.lastPosition.fuel_consumption;
  }

  private setPositionUpdater() {
    timer(0, this.isMyPlayer ? CONFIG.MY_PLANE_POSITION_REFRESH_TIME : CONFIG.PLANE_POSITION_REFRESH_TIME)
      .pipe(
        takeUntil(this.changeNotifiers.destroy$),
        filter(() => !this.isBlocked())
      )
      .subscribe(() => this.updateLastPositionAndAdjustPlane());
  }

  updateLastPosition(position: PlanePosition = this.lastPosition) {
    this.lastPosition = calculatePositionAfterTimeInterval(
      position,
      CONFIG.FLIGHT_ALTITUDE_SCALED,
      this.clockService.getCurrentTime()
    );
    this.changeNotifiers.position$.next();
  }

  private updateLastPositionAndAdjustPlane(position: PlanePosition = this.lastPosition) {
    this.updateLastPosition(position);
    this.updateCartesianFromLastPosition();
  }

  private updateCartesianFromLastPosition() {
    this.cartesianPosition = transformCoordinatesIntoPoint(
      this.lastPosition.coordinates,
      CONFIG.FLIGHT_ALTITUDE_SCALED
    );
    this.cartesianRotation = transformPointAndDirectionIntoRotation(
      this.lastPosition.coordinates,
      this.lastPosition.bearing
    );
  }
}
