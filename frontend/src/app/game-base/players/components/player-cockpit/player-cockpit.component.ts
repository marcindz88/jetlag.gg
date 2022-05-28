import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Airport } from '@pg/game-base/airports/models/airport';
import { NearAirportsList } from '@pg/game-base/airports/models/airport.types';
import { AirportsService } from '@pg/game-base/airports/services/airports.service';
import { determineAirportsInProximity } from '@pg/game-base/airports/utils/utils';
import { BEARING, VELOCITY } from '@pg/game-base/constants/game.constants';
import { KeyEventEnum } from '@pg/game-base/models/keyboard.types';
import { Player } from '@pg/game-base/players/models/player';
import { PlanePosition } from '@pg/game-base/players/models/player.types';
import { KeyboardControlsService } from '@pg/game-base/services/keyboard-controls.service';
import { arePointsEqual } from '@pg/game-base/utils/geo-utils';
import { ReplaySubject, timer } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'pg-player-cockpit',
  templateUrl: './player-cockpit.component.html',
  styleUrls: ['./player-cockpit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerCockpitComponent implements OnInit {
  @Input() player!: Player;
  @Input() airports!: Map<string, Airport>;

  position?: PlanePosition;
  airportList: NearAirportsList = [];
  airportsUpdateTrigger$ = new ReplaySubject<void>();

  constructor(
    private cdr: ChangeDetectorRef,
    private keyboardControlsService: KeyboardControlsService,
    private airportsService: AirportsService
  ) {}

  ngOnInit() {
    this.setUpdatePositionAndAirportsHandler();
    this.setFlightParametersChangeHandler();
    this.setupCockpitControls();
    this.setUpdateAirportsHandler();
  }

  private setupCockpitControls() {
    this.keyboardControlsService.setupKeyEvent(KeyEventEnum.LEFT, this, () => this.updateBearing(-1));
    this.keyboardControlsService.setupKeyEvent(KeyEventEnum.RIGHT, this, () => this.updateBearing(1));
    this.keyboardControlsService.setupKeyEvent(KeyEventEnum.BACKWARD, this, () => this.updateVelocity(-1));
    this.keyboardControlsService.setupKeyEvent(KeyEventEnum.FORWARD, this, () => this.updateVelocity(1));
    this.keyboardControlsService.setupKeyEvent(KeyEventEnum.LAND, this, this.startLandingProcedure.bind(this));
  }

  private updateBearing(multiplier: number) {
    if (!this.player.isGrounded) {
      this.player.updateBearing(multiplier * BEARING.step);
    }
  }

  private updateVelocity(multiplier: number) {
    if (!this.player.isGrounded) {
      this.player.updateVelocity(multiplier * VELOCITY.step);
    }
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
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        const newPosition = this.player.position;
        if (!this.position || !arePointsEqual(this.position?.coordinates, newPosition.coordinates)) {
          this.airportList = determineAirportsInProximity(this.airports, newPosition.coordinates);
          this.airportsUpdateTrigger$.next();
        }
        this.position = newPosition;
        this.cdr.markForCheck();
      });
  }

  private setUpdateAirportsHandler() {
    this.airportsService.updated$.pipe(untilDestroyed(this)).subscribe(() => this.airportsUpdateTrigger$.next());
  }
}
