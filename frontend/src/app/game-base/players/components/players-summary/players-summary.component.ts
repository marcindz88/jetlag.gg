import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';

import { PlayersService } from '../../services/players.service';

@UntilDestroy()
@Component({
  selector: 'pg-players-summary',
  templateUrl: './players-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayersSummaryComponent {
  players = this.playersService.players;

  constructor(public playersService: PlayersService) {}
}
