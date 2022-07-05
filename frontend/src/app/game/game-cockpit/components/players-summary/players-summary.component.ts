import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';

import { PlayersService } from '../../../services/players.service';

@UntilDestroy()
@Component({
  selector: 'pg-players-summary',
  templateUrl: './players-summary.component.html',
  styleUrls: ['players-summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayersSummaryComponent {
  playersSorted$ = this.playersService.playersSorted$;

  constructor(public playersService: PlayersService) {}
}
