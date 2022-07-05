import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { PlanePosition } from '@pg/game/models/player.types';

@UntilDestroy()
@Component({
  selector: 'pg-player-stats',
  templateUrl: './player-stats.component.html',
  styleUrls: ['./player-stats.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerStatsComponent {
  @Input() position!: PlanePosition;
}
