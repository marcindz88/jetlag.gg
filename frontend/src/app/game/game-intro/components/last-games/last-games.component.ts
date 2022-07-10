import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GameStats } from '@pg/game/game-over/models/game-over.models';

@Component({
  selector: 'pg-last-games',
  templateUrl: './last-games.component.html',
  styleUrls: ['last-games.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LastGamesComponent {
  @Input() lastGames!: GameStats[];
}
