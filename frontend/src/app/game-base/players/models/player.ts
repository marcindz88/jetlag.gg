import { MatSnackBarRef } from '@angular/material/snack-bar';
import { Shipment } from '@pg/game-base/airports/models/airport.types';
import { updateTankLevel } from '@pg/game-base/utils/fuel-utils';
import {
  calculateBearingFromDirectionAndRotation,
  calculatePositionAfterTimeInterval,
  transformCoordinatesIntoPoint,
  transformPointAndDirectionIntoRotation,
  transformPointIntoCoordinates,
} from '@pg/game-base/utils/geo-utils';
import { NotificationComponent } from '@shared/components/notification/notification.component';
import { ClockService } from '@shared/services/clock.service';
import { CONFIG } from '@shared/services/config.service';
import { NotificationService } from '@shared/services/notification.service';
import { Subject, take } from 'rxjs';
import { Color, Euler, Object3D, Vector3 } from 'three';
import { degToRad } from 'three/src/math/MathUtils';

import { CrashCauseEnum, CrashData, OtherPlayer, PartialPlayerData, PlanePosition } from './player.types';

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
  crashData?: CrashData;

  shipment: null | Shipment = null;
  shipmentTimeoutHandler?: number;

  planeObject?: Object3D;
  cartesianPosition!: Vector3;
  cartesianRotation!: Euler;

  flightParametersChanged$ = new Subject<void>();

  velocity!: number;
  lastTankLevel!: number;

  private lastPosition!: PlanePosition;
  private fuelConsumption!: number;
  private lastTankUpdateTimestamp: number = this.clockService.getCurrentTime();
  private lastChangeTimestamp: number | null = null;
  private fuelSnackBarRef?: MatSnackBarRef<NotificationComponent>;

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

    this.position = player.position;
  }

  set position(position: PlanePosition) {
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

    this.cartesianPosition = transformCoordinatesIntoPoint(
      this.lastPosition.coordinates,
      CONFIG.FLIGHT_ALTITUDE_SCALED
    );
    this.cartesianRotation = transformPointAndDirectionIntoRotation(
      this.lastPosition.coordinates,
      this.lastPosition.bearing
    );
    this.velocity = this.lastPosition.velocity;
    this.fuelConsumption = this.lastPosition.fuel_consumption;
    this.tankLevel = this.lastPosition.tank_level;
  }

  get position(): PlanePosition {
    if (!this.planeObject) {
      return this.lastPosition;
    }
    const timestamp = this.clockService.getCurrentTime();
    const position = this.planeObject.position.clone();
    const rotation = this.planeObject.rotation.clone();

    this.lastPosition = {
      timestamp,
      coordinates: transformPointIntoCoordinates(position),
      bearing: calculateBearingFromDirectionAndRotation(rotation),
      velocity: this.velocity,
      fuel_consumption: this.fuelConsumption,
      tank_level: this.updateTankLevel(timestamp),
    };
    return this.lastPosition;
  }

  set tankLevel(tankLevel: number) {
    this.lastTankLevel = tankLevel;
    this.lastTankUpdateTimestamp = this.clockService.getCurrentTime();
    this.handleTankLevelNotification();
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
      this.position = playerData.position;
    }
    if (playerData.crash_data) {
      this.crashData = playerData.crash_data;
    }
  }

  updateBearing(bearingChange: number) {
    if (this.isBlocked()) {
      return;
    }
    this.planeObject!.rotation.z += degToRad(bearingChange);
    this.lastChangeTimestamp = this.clockService.getCurrentTime();
    this.flightParametersChanged$.next();
  }

  updateVelocity(velocityChange: number) {
    if (this.isBlocked()) {
      return;
    }

    const velocity = this.velocity + velocityChange;
    if (velocity >= CONFIG.MIN_VELOCITY && velocity <= CONFIG.MAX_VELOCITY) {
      this.velocity = velocity;
      this.lastChangeTimestamp = this.clockService.getCurrentTime();
      this.flightParametersChanged$.next();
    }
  }

  startCrashingPlane() {
    this.isCrashing = true;
  }

  endCrashingPlane() {
    this.isCrashed = true;
    this.isCrashing = false;
    // TODO temporary until backend is ready
    this.crashData = {
      cause: CrashCauseEnum.LACK_OF_FUEL,
      leaderboardPlace: 2,
      packagesDelivered: 5,
    };
  }

  private updateTankLevel(currentTimestamp: number): number {
    this.tankLevel = updateTankLevel(
      currentTimestamp,
      this.lastTankUpdateTimestamp,
      this.lastTankLevel,
      this.fuelConsumption
    );
    return this.lastTankLevel;
  }

  private handleTankLevelNotification() {
    // Not my player -> no notification
    if (!this.isMyPlayer) {
      return;
    }

    const tankLevelPercentage = (this.lastTankLevel / CONFIG.FUEL_TANK_SIZE) * 100;
    // Show notification if tank level below 20% and not on the airport
    if (!this.isGrounded && tankLevelPercentage > 0 && tankLevelPercentage < 20 && !this.fuelSnackBarRef) {
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
    if ((!tankLevelPercentage || this.isGrounded) && this.fuelSnackBarRef) {
      this.fuelSnackBarRef.dismiss();

      // TODO temporary until backend is prepared
      if (!tankLevelPercentage) {
        this.startCrashingPlane();
      }
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

  private isBlocked() {
    return this.isCrashed || this.isCrashing || this.isGrounded;
  }
}
