import { Component, Input } from '@angular/core';
import { OtherPlayer } from '../../models/player.types';

@Component({
  selector: 'pg-player-summary',
  templateUrl: './player-summary.component.html',
  styleUrls: ['./player-summary.component.scss'],
})
export class PlayerSummaryComponent {
  @Input() player!: OtherPlayer;
}
