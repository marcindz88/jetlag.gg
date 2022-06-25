import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
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
import { Subject, take } from 'rxjs';
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
  isMyPlayer = false;
  isBot = false;
  shipment: null | Shipment = null;
  shipmentTimeoutHandler?: number;

  planeObject?: Object3D;
  cartesianPosition!: Vector3;
  cartesianRotation!: Euler;

  flightParametersChanged$ = new Subject<void>();

  velocity!: number;
  lastTankLevel!: number;

  private fuelConsumption!: number;
  private lastTankUpdateTimestamp: number = this.clockService.getCurrentTime();
  private lastChangeTimestamp: number | null = null;
  private fuelSnackBarRef?: MatSnackBarRef<NotificationComponent>;

  constructor(
    player: OtherPlayer,
    isMyPlayer: boolean,
    private clockService: ClockService,
    private matSnackBar: MatSnackBar
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
    const updatedPosition = calculatePositionAfterTimeInterval(
      position,
      CONFIG.FLIGHT_ALTITUDE_SCALED,
      this.clockService.getCurrentTime()
    );
    this.lastChangeTimestamp = updatedPosition.timestamp;

    this.cartesianPosition = transformCoordinatesIntoPoint(updatedPosition.coordinates, CONFIG.FLIGHT_ALTITUDE_SCALED);
    this.cartesianRotation = transformPointAndDirectionIntoRotation(
      updatedPosition.coordinates,
      updatedPosition.bearing
    );
    this.velocity = updatedPosition.velocity;
    this.fuelConsumption = updatedPosition.fuel_consumption;
    this.tankLevel = updatedPosition.tank_level;
  }

  get position(): PlanePosition {
    if (!this.planeObject) {
      throw Error('Plane is not yet rendered cannot obtain position');
    }
    const timestamp = this.clockService.getCurrentTime();
    const position = this.planeObject.position.clone();
    const rotation = this.planeObject.rotation.clone();

    return {
      timestamp,
      coordinates: transformPointIntoCoordinates(position),
      bearing: calculateBearingFromDirectionAndRotation(rotation),
      velocity: this.velocity,
      fuel_consumption: this.fuelConsumption,
      tank_level: this.updateTankLevel(timestamp),
    };
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
  }

  updateBearing(bearingChange: number) {
    this.planeObject!.rotation.z += degToRad(bearingChange);
    this.lastChangeTimestamp = this.clockService.getCurrentTime();
    this.flightParametersChanged$.next();
  }

  updateVelocity(velocityChange: number) {
    const velocity = this.velocity + velocityChange;
    if (velocity >= CONFIG.MIN_VELOCITY && velocity <= CONFIG.MAX_VELOCITY) {
      this.velocity = velocity;
      this.lastChangeTimestamp = this.clockService.getCurrentTime();
      this.flightParametersChanged$.next();
    }
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
    const tankLevelPercentage = (this.lastTankLevel / CONFIG.FUEL_TANK_SIZE) * 100;
    // Show notification if tank level below 10% and not on the airport
    if (tankLevelPercentage > 0 && tankLevelPercentage < 10 && !this.fuelSnackBarRef && !this.isGrounded) {
      this.fuelSnackBarRef = this.matSnackBar.openFromComponent(NotificationComponent, {
        data: {
          text: 'You are running out of fuel, get to the nearest airport to refuel!!!',
          icon: 'warning',
          style: 'warn',
        },
        duration: 0,
      });
      this.fuelSnackBarRef
        .afterDismissed()
        .pipe(take(1))
        .subscribe(() => (this.fuelSnackBarRef = undefined));
      return;
    }

    // Hide snackbar if tank is already empty
    if (!tankLevelPercentage && this.fuelSnackBarRef) {
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
    this.matSnackBar.openFromComponent(NotificationComponent, {
      data: {
        text: `Your shipment containing ${this.shipment!.name} has expired`,
        icon: 'running_with_errors',
        style: 'error',
      },
    });
    this.shipment = null;
  }
}
