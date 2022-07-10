import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UserService } from '@auth/services/user.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ConfirmLogoutDialogComponent } from '@pg/game/game-intro/components/confirm-logout-dialog/confirm-logout-dialog/confirm-logout-dialog.component';
import { GameIntroHttpService } from '@pg/game/game-intro/services/game-intro-http.service';
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
  user = this.userService.user$.value!; // guarded
  serverError: 'lobby_full' | 'already_in_game' | 'unknown_error' | null = null;
  lastGames$ = this.gameIntroHttpService.fetchPlayerLastGames(this.user.nickname);

  constructor(
    private gameIntroHttpService: GameIntroHttpService,
    private mainGameService: MainGameService,
    private playersService: PlayersService,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private matDialog: MatDialog
  ) {}

  joinTheGame() {
    this.gameIntroHttpService
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
              void this.router.navigateByUrl(ROUTES_URLS.game_cockpit, { replaceUrl: true });
            });
        },
        error: err => {
          if (err instanceof HttpErrorResponse) {
            switch (err.status) {
              case HttpStatusCode.Conflict:
                this.serverError = 'lobby_full';
                break;
              case HttpStatusCode.Forbidden:
                this.serverError = 'already_in_game';
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

  logout() {
    this.matDialog
      .open(ConfirmLogoutDialogComponent)
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe(result => {
        if (result) {
          this.userService.resetUser();
          void this.router.navigateByUrl(ROUTES_URLS.login, { replaceUrl: true });
        }
      });
  }
}
