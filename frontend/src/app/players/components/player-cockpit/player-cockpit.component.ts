import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Player } from '@pg/players/models/player';
import { PlanePosition } from '@pg/players/models/player.types';
import { timer } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'pg-player-cockpit',
  templateUrl: './player-cockpit.component.html',
  styleUrls: ['./player-cockpit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerCockpitComponent implements OnInit {
  @Input() player!: Player;

  position?: PlanePosition;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.setUpdatePositionHandler();
    this.setFlightParametersChangeHandler();
  }

  setUpdatePositionHandler() {
    timer(0, 1000)
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.position = this.player.position;
        this.cdr.markForCheck();
      });
  }

  setFlightParametersChangeHandler() {
    this.player.flightParametersChanged$.pipe(untilDestroyed(this)).subscribe(() => {
      this.cdr.markForCheck();
    });
  }
}
