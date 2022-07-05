import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Player } from '@pg/game/models/player';
import { DeathCauseEnum } from '@pg/game/models/player.types';
import { GameHttpService } from '@pg/game/services/game-http.service';
import { MainGameService } from '@pg/game/services/main-game.service';
import { ROUTES_URLS } from '@shared/constants/routes';
import { enableLoader } from '@shared/operators/operators';

@UntilDestroy()
@Component({
  selector: 'pg-game-over',
  templateUrl: './game-over.component.html',
  styleUrls: ['game-over.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameOverComponent {
  @Input() player?: Player;

  readonly DeathCauseEnum = DeathCauseEnum;

  constructor(
    private gameHttpService: GameHttpService,
    private mainGameService: MainGameService,
    private router: Router
  ) {
    this.mainGameService.endGame();
  }

  restart() {
    this.gameHttpService
      .join()
      .pipe(enableLoader)
      .subscribe(() => {
        void this.router.navigateByUrl(ROUTES_URLS.game);
      });
  }
}
