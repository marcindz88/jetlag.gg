import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { PlanePosition } from '@pg/game-base/players/models/player.types';

@UntilDestroy()
@Component({
  selector: 'pg-player-cockpit-stats',
  templateUrl: './player-cockpit-stats.component.html',
  styleUrls: ['./player-cockpit-stats.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerCockpitStatsComponent {
  @Input() position!: PlanePosition;
}
