import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NearAirportsList } from '@pg/game-base/airports/models/airport.types';
import { AirportsService } from '@pg/game-base/airports/services/airports.service';
import { determineAirportsInProximity } from '@pg/game-base/airports/utils/utils';
import { KeyEventEnum } from '@pg/game-base/models/keyboard.types';
import { PlanePosition } from '@pg/game-base/players/models/player.types';
import { PlayersService } from '@pg/game-base/players/services/players.service';
import { KeyboardControlsService } from '@pg/game-base/services/keyboard-controls.service';
import { arePointsEqual } from '@pg/game-base/utils/geo-utils';
import { CONFIG } from '@shared/services/config.service';
import { map, ReplaySubject, skipWhile, timer } from 'rxjs';

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

  position?: PlanePosition;
  airportList: NearAirportsList = [];
  airportsUpdateTrigger$ = new ReplaySubject<void>();
  showHelp = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private keyboardControlsService: KeyboardControlsService,
    private airportsService: AirportsService,
    private playersService: PlayersService
  ) {}

  ngOnInit() {
    this.setUpdatePositionAndAirportsHandler();
    this.setFlightParametersChangeHandler();
    this.setupCockpitControls();
    this.setUpdateAirportsHandler();
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
    if (!this.player.isGrounded && this.airportList[0]?.isNearbyAndAvailable$.value) {
      this.airportsService.requestLandingPermission(this.airportList[0].id);
    }
  }

  private setFlightParametersChangeHandler() {
    this.player.flightParametersChanged$.pipe(untilDestroyed(this)).subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  private setUpdatePositionAndAirportsHandler() {
    timer(0, 250)
      .pipe(
        untilDestroyed(this),
        skipWhile(() => this.player.isGrounded || this.player.isCrashed),
        map(() => this.player.position)
      )
      .subscribe(position => {
        if (
          (!this.position || !arePointsEqual(this.position?.coordinates, position.coordinates)) &&
          this.position?.velocity !== 0
        ) {
          this.airportList = determineAirportsInProximity(this.airports, position.coordinates);
          this.airportsUpdateTrigger$.next();
        }
        this.position = position;
        this.cdr.markForCheck();
      });
  }

  private setUpdateAirportsHandler() {
    this.airportsService.updated$.pipe(untilDestroyed(this)).subscribe(() => this.airportsUpdateTrigger$.next());
  }
}
