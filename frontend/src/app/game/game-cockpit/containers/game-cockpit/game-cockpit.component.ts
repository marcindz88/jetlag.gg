import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { GameCockpitHttpService } from '@pg/game/game-cockpit/services/game-cockpit-http.service';
import { NearAirportsList } from '@pg/game/models/airport.types';
import { KeyEventEnum } from '@pg/game/models/keyboard-events.types';
import { PlaneExtendedPosition } from '@pg/game/models/player.types';
import { AirportsService } from '@pg/game/services/airports.service';
import { KeyboardAndTouchControlsService } from '@pg/game/services/keyboard-and-touch-controls.service';
import { PlayersService } from '@pg/game/services/players.service';
import { determineAirportsInProximity } from '@pg/game/utils/airport-utils';
import { isTankLevelLow } from '@pg/game/utils/fuel-utils';
import { arePointsEqual } from '@pg/game/utils/geo-utils';
import { isLowVelocity } from '@pg/game/utils/velocity-utils';
import { NotificationComponent } from '@shared/components/notification/notification.component';
import { ROUTES_URLS } from '@shared/constants/routes';
import { ClockService } from '@shared/services/clock.service';
import { CONFIG } from '@shared/services/config.service';
import { NotificationService } from '@shared/services/notification.service';
import { QueueBarRef } from 'ngx-mat-queue-bar/lib/queue-bar-ref';
import { ReplaySubject, take, throttleTime } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'pg-game-cockpit',
  templateUrl: './game-cockpit.component.html',
  styleUrls: ['./game-cockpit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameCockpitComponent implements OnInit {
  @HostListener('window:beforeunload', ['$event'])
  beforeTabClose($event: BeforeUnloadEvent) {
    $event.preventDefault();

    return ($event.returnValue =
      'Are you sure you want to exit the game? You will not be able to reconnect to this session');
  }

  @HostListener('window:unload')
  tabClose() {
    this.gameCockpitHttpService.exitGame();
  }

  readonly player = this.playersService.myPlayer!;
  readonly airports = this.airportsService.airports;

  airportList: NearAirportsList = [];
  airportsUpdateTrigger$ = new ReplaySubject<void>();
  showHelp = false;
  lastPosition!: PlaneExtendedPosition;

  private fuelSnackBarRef?: QueueBarRef<NotificationComponent>;
  private velocitySnackBarRef?: QueueBarRef<NotificationComponent>;
  private shipmentTimeoutHandler?: number;

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    private keyboardControlsService: KeyboardAndTouchControlsService,
    private airportsService: AirportsService,
    private playersService: PlayersService,
    private notificationService: NotificationService,
    private gameCockpitHttpService: GameCockpitHttpService,
    private clockService: ClockService,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.setAirportsAndFuelUpdater();
    this.setupCockpitControls();
    this.setUpdateAirportsHandler();
    this.setPlayerUiChanges();
    this.setPlayerPositionUpdateNotifier();
    this.setPlayerShipmentHandler();
    this.setPlayerDeathChanges();
    this.showHelpSnackbar();
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

    this.keyboardControlsService.setupKeyEvent(KeyEventEnum.LAND, this, this.startLandingProcedure.bind(this));
    this.keyboardControlsService.setupKeyEvent(KeyEventEnum.HELP, this, () => {
      this.showHelp = !this.showHelp;
      this.cdr.markForCheck();
    });
  }

  private startLandingProcedure() {
    if (!this.player.isGrounded && this.airportList[0]?.isNearby$.value) {
      this.airportsService.requestLandingPermission(this.airportList[0].id);
    }
  }

  private setAirportsAndFuelUpdater() {
    this.player.changeNotifiers.position$.pipe(untilDestroyed(this), throttleTime(250)).subscribe(() => {
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

  private setPlayerDeathChanges() {
    this.player.changeNotifiers.destroy$.pipe(untilDestroyed(this)).subscribe(() => {
      this.ngZone.run(() => {
        void this.router.navigateByUrl(ROUTES_URLS.game_over, { replaceUrl: true });
      });
    });
  }

  private setPlayerPositionUpdateNotifier() {
    this.player.changeNotifiers.velocityOrBearing$.pipe(untilDestroyed(this)).subscribe(() => {
      this.handleLowVelocityNotification();
      this.playersService.emitPlayerPositionUpdate(this.player.lastPosition);
    });
  }

  private updateNearbyAirports(position: PlaneExtendedPosition) {
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
          text: 'Speed too low, accelerate!',
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
    if ((!isLowVelocity(this.player.lastPosition.velocity) || this.player.isBlocked()) && this.velocitySnackBarRef) {
      this.velocitySnackBarRef.dismiss();
    }
  }

  private handleLowTankLevelNotification() {
    // Show notification if tank level below 20% and not on the airport
    if (!this.player.isGrounded && isTankLevelLow(this.player.lastPosition.tank_level) && !this.fuelSnackBarRef) {
      this.fuelSnackBarRef = this.notificationService.openNotification(
        {
          text: 'Running out of fuel, refuel at the nearest airport!',
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
      text: `Shipment containing ${this.player.shipment!.name} has expired`,
      icon: 'running_with_errors',
      style: 'error',
    });
    this.player.shipment = null;
  }

  private showHelpSnackbar() {
    this.notificationService.openNotification(
      {
        text: 'You can access help and steering info by pressing [H] or clicking here',
        icon: 'info',
        clickAction: () => this.keyboardControlsService.simulateKeyPress(KeyEventEnum.HELP),
      },
      { duration: 10000 }
    );
  }
}
