import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

import { PlayersService } from '../../services/players.service';

@UntilDestroy()
@Component({
  selector: 'pg-players-summary',
  templateUrl: './players-summary.component.html',
  styleUrls: ['./players-summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayersSummaryComponent {
  players = this.playersService.players;

  constructor(private playersService: PlayersService, private cdr: ChangeDetectorRef) {
    this.setupPlayersChanges();
  }

  private setupPlayersChanges() {
    this.playersService.changed$.pipe(untilDestroyed(this)).subscribe(() => this.cdr.markForCheck());
  }
}
