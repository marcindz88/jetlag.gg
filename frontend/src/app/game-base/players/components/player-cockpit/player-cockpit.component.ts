import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Airport } from '@pg/game-base/airports/models/airport';
import { NearAirportsList } from '@pg/game-base/airports/models/airport.types';
import { determineAirportsInProximity } from '@pg/game-base/airports/utils/utils';
import { Player } from '@pg/game-base/players/models/player';
import { PlanePosition } from '@pg/game-base/players/models/player.types';
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

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.setUpdatePositionAndAirportsHandler();
    this.setFlightParametersChangeHandler();
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
}
