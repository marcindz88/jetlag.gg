import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Player } from '@pg/game-base/players/models/player';
import { CrashCauseEnum, OtherPlayer } from '@pg/game-base/players/models/player.types';
import { Logger } from '@shared/services/logger.service';

@UntilDestroy()
@Component({
  selector: 'pg-game-over',
  templateUrl: './game-over.component.html',
  styleUrls: ['game-over.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameOverComponent {
  @Input() player?: Player;
  @Input() playersLeaderboard?: OtherPlayer[] | null;

  readonly CrashCauseEnum = CrashCauseEnum;

  restart() {
    // TODO
    Logger.error(GameOverComponent, 'TODO restarting the game');
  }
}
