import { MatSnackBarRef } from '@angular/material/snack-bar';
import { Shipment } from '@pg/game-base/airports/models/airport.types';
import { isTankLevelLow } from '@pg/game-base/utils/fuel-utils';
import {
  calculateBearingFromDirectionAndRotation,
  calculatePositionAfterTimeInterval,
  transformCoordinatesIntoPoint,
  transformPointAndDirectionIntoRotation,
} from '@pg/game-base/utils/geo-utils';
import { determineNewVelocity, isLowVelocity } from '@pg/game-base/utils/velocity-utils';
import { NotificationComponent } from '@shared/components/notification/notification.component';
import { ClockService } from '@shared/services/clock.service';
import { CONFIG } from '@shared/services/config.service';
import { NotificationService } from '@shared/services/notification.service';
import { filter, Subject, take, takeUntil, timer } from 'rxjs';
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
  shipmentTimeoutHandler?: number;

  planeObject?: Object3D;
  cartesianPosition!: Vector3;
  cartesianRotation!: Euler;

  flightParametersChanged$ = new Subject<void>();
  lastPosition$ = new Subject<PlanePosition>();
  destroy$ = new Subject<void>();

  lastPosition!: PlanePosition;

  private fuelConsumption!: number;
  private lastChangeTimestamp: number | null = null;
  private fuelSnackBarRef?: MatSnackBarRef<NotificationComponent>;
  private velocitySnackBarRef?: MatSnackBarRef<NotificationComponent>;

  constructor(
    player: OtherPlayer,
    isMyPlayer: boolean,
    private clockService: ClockService,
    private notificationService: NotificationService
  ) {
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

  get position(): PlanePosition {
    this.updatePositionInternally();
    return this.lastPosition;
  }

  updatePlayer(playerData: PartialPlayerData) {
    if ('connected' in playerData) {
      this.connected = !!playerData.connected;
    }
    if ('is_grounded' in playerData) {
      this.isGrounded = !!playerData.is_grounded;
    }
    if ('shipment' in playerData) {
      this.shipment = playerData.shipment || null;
      this.setShipmentExpirationHandler();
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
    }
  }

  startCrashingPlane() {
    this.velocitySnackBarRef?.dismiss();
    this.fuelSnackBarRef?.dismiss();
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
    this.updatePositionInternally();
    this.lastPosition.bearing = calculateBearingFromDirectionAndRotation(this.planeObject!.rotation);
    this.lastChangeTimestamp = this.clockService.getCurrentTime();
    this.flightParametersChanged$.next();
  }

  isBlocked() {
    return this.isCrashed || this.isCrashing || this.isGrounded;
  }

  destroy() {
    this.destroy$.next();
  }

  private updateVelocity(isAccelerate: boolean) {
    if (this.isBlocked()) {
      return;
    }

    const velocity = determineNewVelocity(this.lastPosition.velocity, isAccelerate);
    if (velocity !== this.lastPosition.velocity) {
      this.updatePositionInternally();
      this.lastPosition.velocity = velocity;
      this.lastChangeTimestamp = this.clockService.getCurrentTime();
      this.flightParametersChanged$.next();
      this.handleLowVelocityNotification();
    }
  }

  private handleLowVelocityNotification() {
    // Not my player -> no notification
    if (!this.isMyPlayer) {
      return;
    }

    // Show notification if low velocity
    if (!this.isGrounded && isLowVelocity(this.lastPosition.velocity) && !this.velocitySnackBarRef) {
      this.velocitySnackBarRef = this.notificationService.openNotification(
        {
          text: 'You are travelling at extremely low velocity, accelerate to avoid crashing',
          icon: 'warning',
          style: 'warn',
        },
        { duration: 0 }
      );
      this.velocitySnackBarRef
        .afterDismissed()
        .pipe(take(1))
        .subscribe(() => (this.velocitySnackBarRef = undefined));
      return;
    }

    // Hide snackbar if velocity is no longer low
    if ((!isLowVelocity(this.lastPosition.velocity) || this.isGrounded) && this.velocitySnackBarRef) {
      this.velocitySnackBarRef.dismiss();
    }
  }

  private handleLowTankLevelNotification() {
    // Not my player -> no notification
    if (!this.isMyPlayer) {
      return;
    }

    // Show notification if tank level below 20% and not on the airport
    if (!this.isGrounded && isTankLevelLow(this.lastPosition.tank_level) && !this.fuelSnackBarRef) {
      this.fuelSnackBarRef = this.notificationService.openNotification(
        {
          text: 'You are running out of fuel, get to the nearest airport to refuel!!!',
          icon: 'warning',
          style: 'warn',
        },
        { duration: 0 }
      );
      this.fuelSnackBarRef
        .afterDismissed()
        .pipe(take(1))
        .subscribe(() => (this.fuelSnackBarRef = undefined));
      return;
    }

    // Hide snackbar if tank is already empty or plane is grounded
    if ((!this.lastPosition.tank_level || this.isGrounded) && this.fuelSnackBarRef) {
      this.fuelSnackBarRef.dismiss();
    }
  }

  private setShipmentExpirationHandler() {
    if (!this.isMyPlayer) {
      return;
    }
    if (this.shipment) {
      const remainingTime = this.shipment.valid_till - this.clockService.getCurrentTime();
      if (remainingTime <= 0) {
        this.showShipmentExpiredMessage.bind(this);
        return;
      }
      this.shipmentTimeoutHandler = setTimeout(this.showShipmentExpiredMessage.bind(this), remainingTime);
    } else {
      if (this.shipmentTimeoutHandler !== undefined) {
        clearTimeout(this.shipmentTimeoutHandler);
        this.shipmentTimeoutHandler = undefined;
      }
    }
  }

  private showShipmentExpiredMessage() {
    this.notificationService.openNotification({
      text: `Your shipment containing ${this.shipment!.name} has expired`,
      icon: 'running_with_errors',
      style: 'error',
    });
    this.shipment = null;
  }

  private setPositionFromEvent(position: PlanePosition) {
    if (this.lastChangeTimestamp && this.lastChangeTimestamp > position.timestamp && !this.isGrounded) {
      // Ignore position update if locally was updated before or messages came out of order
      return;
    }

    this.lastPosition = calculatePositionAfterTimeInterval(
      position,
      CONFIG.FLIGHT_ALTITUDE_SCALED,
      this.clockService.getCurrentTime()
    );
    this.lastChangeTimestamp = this.lastPosition.timestamp;
    this.updateCartesianFromLastPosition();

    this.fuelConsumption = this.lastPosition.fuel_consumption;
  }

  private setPositionUpdater() {
    timer(0, this.isMyPlayer ? CONFIG.MY_PLANE_POSITION_REFRESH_TIME : CONFIG.PLANE_POSITION_REFRESH_TIME)
      .pipe(
        takeUntil(this.destroy$),
        filter(() => !this.isBlocked())
      )
      .subscribe(this.updatePositionInternally.bind(this));
  }

  updatePositionInternally() {
    this.lastPosition = calculatePositionAfterTimeInterval(
      this.lastPosition,
      CONFIG.FLIGHT_ALTITUDE_SCALED,
      this.clockService.getCurrentTime()
    );
    this.lastPosition$.next(this.lastPosition);
    this.updateCartesianFromLastPosition();
    this.handleLowTankLevelNotification();
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
