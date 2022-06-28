import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatSnackBarRef } from '@angular/material/snack-bar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NearAirportsList } from '@pg/game-base/airports/models/airport.types';
import { AirportsService } from '@pg/game-base/airports/services/airports.service';
import { determineAirportsInProximity } from '@pg/game-base/airports/utils/utils';
import { KeyEventEnum } from '@pg/game-base/models/keyboard.types';
import { PlanePosition } from '@pg/game-base/players/models/player.types';
import { PlayersService } from '@pg/game-base/players/services/players.service';
import { KeyboardControlsService } from '@pg/game-base/services/keyboard-controls.service';
import { isTankLevelLow } from '@pg/game-base/utils/fuel-utils';
import { arePointsEqual } from '@pg/game-base/utils/geo-utils';
import { isLowVelocity } from '@pg/game-base/utils/velocity-utils';
import { NotificationComponent } from '@shared/components/notification/notification.component';
import { ClockService } from '@shared/services/clock.service';
import { CONFIG } from '@shared/services/config.service';
import { NotificationService } from '@shared/services/notification.service';
import { auditTime, ReplaySubject, take } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'pg-player-cockpit',
  templateUrl: './player-cockpit.component.html',
  styleUrls: ['./player-cockpit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerCockpitComponent implements OnInit {
  readonly player = this.playersService.myPlayer!;
  readonly airports = this.airportsService.airports;

  airportList: NearAirportsList = [];
  airportsUpdateTrigger$ = new ReplaySubject<void>();
  showHelp = false;
  lastPosition!: PlanePosition;

  private fuelSnackBarRef?: MatSnackBarRef<NotificationComponent>;
  private velocitySnackBarRef?: MatSnackBarRef<NotificationComponent>;
  private shipmentTimeoutHandler?: number;

  constructor(
    private cdr: ChangeDetectorRef,
    private keyboardControlsService: KeyboardControlsService,
    private airportsService: AirportsService,
    private playersService: PlayersService,
    private notificationService: NotificationService,
    private clockService: ClockService
  ) {}

  ngOnInit() {
    this.setAirportsAndFuelUpdater();
    this.setupCockpitControls();
    this.setUpdateAirportsHandler();
    this.setPlayerUiChanges();
    this.setPlayerPositionUpdateNotifier();
    this.setPlayerShipmentHandler();
  }

  private setupCockpitControls() {
    this.keyboardControlsService.setupKeyEvent(KeyEventEnum.TURN_LEFT, this, () =>
      this.player.updateBearing(-CONFIG.STEP_BEARING)
    );
    this.keyboardControlsService.setupKeyEvent(KeyEventEnum.TURN_RIGHT, this, () =>
      this.player.updateBearing(CONFIG.STEP_BEARING)
    );
    this.keyboardControlsService.setupKeyEvent(KeyEventEnum.BACKWARD, this, () => this.player.decelerate());
    this.keyboardControlsService.setupKeyEvent(KeyEventEnum.FORWARD, this, () => this.player.accelerate());

    this.keyboardControlsService.setupKeyEvent(
      KeyEventEnum.LAND_OR_TAKE_OFF,
      this,
      this.startLandingProcedure.bind(this)
    );
    this.keyboardControlsService.setupKeyEvent(KeyEventEnum.HELP, this, () => (this.showHelp = !this.showHelp));
  }

  private startLandingProcedure() {
    if (!this.player.isGrounded && this.airportList[0]?.isNearby$.value) {
      this.airportsService.requestLandingPermission(this.airportList[0].id);
    }
  }

  private setAirportsAndFuelUpdater() {
    this.player.changeNotifiers.position$.pipe(untilDestroyed(this), auditTime(250)).subscribe(() => {
      const position = this.player.lastPosition;
      this.updateNearbyAirports(position);
      this.handleLowTankLevelNotification();
      this.lastPosition = position;
      this.cdr.markForCheck();
    });
  }

  private setPlayerShipmentHandler() {
    this.player.changeNotifiers.shipment$.pipe(untilDestroyed(this)).subscribe(() => {
      this.setShipmentExpirationHandler();
      this.cdr.markForCheck();
    });
  }

  private setPlayerUiChanges() {
    this.player.changeNotifiers.blocked$.pipe(untilDestroyed(this)).subscribe(() => {
      this.discardWarningSnackbars();
      this.cdr.detectChanges();
    });
  }

  private setPlayerPositionUpdateNotifier() {
    this.player.changeNotifiers.velocityOrBearing$.pipe(untilDestroyed(this)).subscribe(() => {
      this.handleLowVelocityNotification();
      this.playersService.emitPlayerPositionUpdate(this.player);
    });
  }

  private updateNearbyAirports(position: PlanePosition) {
    if (
      (!this.lastPosition || !arePointsEqual(this.lastPosition?.coordinates, position.coordinates)) &&
      position?.velocity !== 0
    ) {
      this.airportList = determineAirportsInProximity(this.airports, position.coordinates);
      this.airportsUpdateTrigger$.next();
    }
  }

  private discardWarningSnackbars() {
    this.velocitySnackBarRef?.dismiss();
    this.fuelSnackBarRef?.dismiss();
  }

  private setUpdateAirportsHandler() {
    this.airportsService.updated$.pipe(untilDestroyed(this)).subscribe(() => this.airportsUpdateTrigger$.next());
  }

  private handleLowVelocityNotification() {
    // Show notification if low velocity
    if (!this.player.isGrounded && isLowVelocity(this.player.lastPosition.velocity) && !this.velocitySnackBarRef) {
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
    if ((!isLowVelocity(this.player.lastPosition.velocity) || this.player.isGrounded) && this.velocitySnackBarRef) {
      this.velocitySnackBarRef.dismiss();
    }
  }

  private handleLowTankLevelNotification() {
    // Show notification if tank level below 20% and not on the airport
    if (!this.player.isGrounded && isTankLevelLow(this.player.lastPosition.tank_level) && !this.fuelSnackBarRef) {
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
    if ((!this.player.lastPosition.tank_level || this.player.isGrounded) && this.fuelSnackBarRef) {
      this.fuelSnackBarRef.dismiss();
    }
  }

  private setShipmentExpirationHandler() {
    if (this.player.shipment) {
      const remainingTime = this.player.shipment.valid_till - this.clockService.getCurrentTime();
      if (remainingTime <= 0) {
        this.showShipmentExpiredMessage.bind(this);
        return;
      }
      this.shipmentTimeoutHandler = window.setTimeout(this.showShipmentExpiredMessage.bind(this), remainingTime);
    } else {
      if (this.shipmentTimeoutHandler !== undefined) {
        clearTimeout(this.shipmentTimeoutHandler);
        this.shipmentTimeoutHandler = undefined;
      }
    }
  }

  private showShipmentExpiredMessage() {
    this.notificationService.openNotification({
      text: `Your shipment containing ${this.player.shipment!.name} has expired`,
      icon: 'running_with_errors',
      style: 'error',
    });
    this.player.shipment = null;
  }
}
