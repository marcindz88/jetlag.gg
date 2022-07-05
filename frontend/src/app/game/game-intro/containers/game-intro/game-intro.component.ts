import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '@auth/services/user.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { GameHttpService } from '@pg/game/services/game-http.service';
import { MainGameService } from '@pg/game/services/main-game.service';
import { PlayersService } from '@pg/game/services/players.service';
import { ROUTES_URLS } from '@shared/constants/routes';
import { enableLoader } from '@shared/operators/operators';
import { filter } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'pg-game-intro',
  templateUrl: './game-intro.component.html',
  styleUrls: ['game-intro.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameIntroComponent {
  user = this.userService.user$.value!;
  serverError: 'lobby_full' | 'unknown_error' | null = null;

  constructor(
    private gameHttpService: GameHttpService,
    private mainGameService: MainGameService,
    private playersService: PlayersService,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  joinTheGame() {
    this.gameHttpService
      .join()
      .pipe(enableLoader)
      .subscribe({
        next: player => {
          this.mainGameService.startGame(player.id, player.token);
          // Wait until player fetched before proceeding
          this.playersService.changed$
            .pipe(
              untilDestroyed(this),
              enableLoader,
              filter(() => !!this.playersService.myPlayer)
            )
            .subscribe(() => {
              void this.router.navigateByUrl(ROUTES_URLS.game_cockpit);
            });
        },
        error: err => {
          if (err instanceof HttpErrorResponse) {
            switch (err.status) {
              case HttpStatusCode.Conflict:
                this.serverError = 'lobby_full';
                break;
              default:
                this.serverError = 'unknown_error';
                break;
            }
            this.cdr.markForCheck();
          }
        },
      });
  }
}
