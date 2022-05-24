import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { OtherPlayer } from '../../models/player.types';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[pg-player-summary]',
  templateUrl: './player-summary.component.html',
  styleUrls: ['./player-summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerSummaryComponent {
  @Input() player!: OtherPlayer;
}
