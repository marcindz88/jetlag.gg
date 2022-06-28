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

import { DeathCauseEnum, OtherPlayer, PartialPlayerData, PlanePosition, PlayerUpdateType } from './player.types';

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
  cartesianPosition!: Vector3;
  cartesianRotation!: Euler;

  change$ = new Subject<PlayerUpdateType>();
  destroy$ = this.getChangeNotifier(PlayerUpdateType.DESTROY);

  lastPosition!: PlanePosition;

  private fuelConsumption!: number;
  private lastChangeTimestamp: number | null = null;

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
  }

  get currentPosition(): PlanePosition {
    return calculatePositionAfterTimeInterval(
      this.lastPosition,
      CONFIG.FLIGHT_ALTITUDE_SCALED,
      this.clockService.getCurrentTime()
    );
  }

  getChangeNotifier(...updateTypes: PlayerUpdateType[]) {
    if (!updateTypes.length) {
      return this.change$;
    }
    return this.change$.pipe(filter(type => updateTypes.includes(type)));
  }

  updatePlayer(playerData: PartialPlayerData) {
    if ('connected' in playerData) {
      this.connected = !!playerData.connected;
    }
    if ('is_grounded' in playerData && playerData.is_grounded !== this.isGrounded) {
      this.isGrounded = !!playerData.is_grounded;
      this.change$.next(PlayerUpdateType.GROUNDED);
    }
    if ('shipment' in playerData && playerData.shipment !== this.shipment) {
      this.shipment = playerData.shipment || null;
      this.change$.next(PlayerUpdateType.SHIPMENT);
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
      this.change$.next(PlayerUpdateType.BEFORE_CRASH);
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
    this.planeObject!.rotation.z += degToRad(bearingChange);
    this.updateLastPosition();
    this.lastPosition.bearing = calculateBearingFromDirectionAndRotation(this.planeObject!.rotation);
    this.lastChangeTimestamp = this.clockService.getCurrentTime();
    this.change$.next(PlayerUpdateType.BEARING);
  }

  isBlocked() {
    return this.isCrashed || this.isCrashing || this.isGrounded;
  }

  destroy() {
    this.change$.next(PlayerUpdateType.DESTROY);
  }

  private updateVelocity(isAccelerate: boolean) {
    if (this.isBlocked()) {
      return;
    }

    const velocity = determineNewVelocity(this.lastPosition.velocity, isAccelerate);
    if (velocity !== this.lastPosition.velocity) {
      this.updateLastPositionAndAdjustPlane();
      this.lastPosition.velocity = velocity;
      this.lastChangeTimestamp = this.clockService.getCurrentTime();
      this.change$.next(PlayerUpdateType.VELOCITY);
    }
  }

  private setPositionFromEvent(position: PlanePosition) {
    if (this.lastChangeTimestamp && this.lastChangeTimestamp >= position.timestamp && !this.isGrounded) {
      // Ignore position update if locally was updated before or messages came out of order
      return;
    }

    this.updateLastPositionAndAdjustPlane(position);
    this.lastChangeTimestamp = this.lastPosition.timestamp;
    this.fuelConsumption = this.lastPosition.fuel_consumption;
  }

  private setPositionUpdater() {
    timer(0, this.isMyPlayer ? CONFIG.MY_PLANE_POSITION_REFRESH_TIME : CONFIG.PLANE_POSITION_REFRESH_TIME)
      .pipe(
        takeUntil(this.destroy$),
        filter(() => !this.isBlocked())
      )
      .subscribe(() => this.updateLastPositionAndAdjustPlane());
  }

  updateLastPosition(position: PlanePosition = this.lastPosition) {
    const lastTankLevel = this.lastPosition?.tank_level;
    this.lastPosition = calculatePositionAfterTimeInterval(
      position,
      CONFIG.FLIGHT_ALTITUDE_SCALED,
      this.clockService.getCurrentTime()
    );
    // If it is blocked then only tanking could be the change
    if (!this.isBlocked() && position.velocity) {
      this.change$.next(PlayerUpdateType.POSITION);
    } else if (this.lastPosition.tank_level !== lastTankLevel) {
      this.change$.next(PlayerUpdateType.FUEL_LEVEL);
    }
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
