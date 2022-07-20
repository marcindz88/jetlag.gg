import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { GameOverStore } from '@pg/game/game-over/services/game-over.store';
import { MainGameService } from '@pg/game/services/main-game.service';
import { ROUTES_URLS } from '@shared/constants/routes';

import { PlayersService } from '../../../services/players.service';

@UntilDestroy()
@Component({
  selector: 'pg-game-over',
  templateUrl: './game-over.component.html',
  styleUrls: ['game-over.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [GameOverStore],
})
export class GameOverComponent {
  readonly includedShareButtons = ['facebook', 'linkedin', 'twitter', 'telegram', 'whatsapp', 'email'];

  readonly myPlayer = this.playersService.myPlayer!;
  readonly myPlayerLastGame$ = this.gameOverStore.myPlayerLastGame$;
  readonly myPlayerBestGame$ = this.gameOverStore.myPlayerBestGame$;
  readonly allFetched$ = this.gameOverStore.allFetched$;
  readonly leaderboard$ = this.gameOverStore.leaderboard$;
  readonly isListLoading$ = this.gameOverStore.isListLoading$;

  isShareOn = false;

  constructor(
    private mainGameService: MainGameService,
    private playersService: PlayersService,
    private router: Router,
    private gameOverStore: GameOverStore
  ) {
    this.mainGameService.endGame();
    this.gameOverStore.getMyPlayerBest(this.myPlayer.nickname);
    this.gameOverStore.getMyPlayerLast(this.myPlayer.nickname);
    this.gameOverStore.getLeaderboardNextPage();
  }

  restart() {
    void this.router.navigateByUrl(ROUTES_URLS.game, { replaceUrl: true });
  }

  share() {
    this.isShareOn = true;
  }
}
