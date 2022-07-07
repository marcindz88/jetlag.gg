import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { LeaderboardPlayerResult, LeaderboardResponse } from '@pg/game/game-over/models/game-over.models';
import { GameOverHttpService } from '@pg/game/game-over/services/game-over-http.service';
import { enableLoader } from '@shared/operators/operators';
import { CONFIG } from '@shared/services/config.service';
import { Logger } from '@shared/services/logger.service';
import { Observable, of, switchMap } from 'rxjs';

export interface GameOverState {
  currentPage: number;
  leaderboard: LeaderboardResponse | null;
  myPlayerBestResult: LeaderboardPlayerResult | null;
  myPlayerLastResult: LeaderboardPlayerResult | null;
  allFetched: boolean;
  isListLoading: boolean;
}

@Injectable()
export class GameOverStore extends ComponentStore<GameOverState> {
  // SELECTORS
  readonly leaderboard$ = this.select(state => state.leaderboard);
  readonly myPlayerBestGame$ = this.select(state => state.myPlayerBestResult);
  readonly myPlayerLastGame$ = this.select(state => state.myPlayerLastResult);
  readonly allFetched$ = this.select(state => state.allFetched);
  readonly isListLoading$ = this.select(state => state.isListLoading);

  // UPDATERS
  private readonly setAllFetched = this.updater(state => ({
    ...state,
    allFetched: true,
  }));
  private readonly setLoading = this.updater((state, isLoading: boolean) => ({
    ...state,
    isListLoading: isLoading,
  }));
  private readonly incrementPage = this.updater(state => ({
    ...state,
    currentPage: state.currentPage + 1,
  }));

  private readonly addMyPlayerBestResult = this.updater((state, myPlayerBestResult: LeaderboardPlayerResult) => ({
    ...state,
    myPlayerBestResult,
  }));

  private readonly addMyPlayerLastResult = this.updater((state, myPlayerLastResult: LeaderboardPlayerResult) => ({
    ...state,
    myPlayerLastResult,
  }));

  private readonly addLeaderboardRows = this.updater((state, leaderboard: LeaderboardResponse) => ({
    ...state,
    leaderboard: {
      results: [...(state.leaderboard?.results || []), ...leaderboard.results],
      total: leaderboard.total,
    },
    currentPage: state.currentPage++,
  }));

  // EFFECTS
  readonly getLeaderboardNextPage = this.effect(trigger$ => {
    const total = this.get().leaderboard?.total;
    if (total && this.get().currentPage * CONFIG.LEADERBOARD_TABLE_LENGTH >= total) {
      this.setAllFetched();
      return of(undefined);
    }

    this.setLoading(true);

    return trigger$.pipe(
      switchMap(() =>
        this.gameOverHttpService
          .fetchLeaderboard(
            CONFIG.LEADERBOARD_TABLE_LENGTH,
            (this.get().currentPage + 1) * CONFIG.LEADERBOARD_TABLE_LENGTH
          )
          .pipe(
            tapResponse(
              (response: LeaderboardResponse) => {
                this.addLeaderboardRows(response);
                this.incrementPage();
                this.setLoading(false);
              },
              (error: HttpErrorResponse) => Logger.error(GameOverStore, error) // TODO error handling
            )
          )
      )
    );
  });

  readonly getMyPlayerBest = this.effect((nickname$: Observable<string>) => {
    return nickname$.pipe(
      switchMap(nickname =>
        this.gameOverHttpService.fetchPlayerBest(nickname).pipe(
          tapResponse(
            playerResult => this.addMyPlayerBestResult(playerResult),
            (error: HttpErrorResponse) => Logger.error(GameOverStore, error) // TODO error handling
          )
        )
      )
    );
  });

  readonly getMyPlayerLast = this.effect((nickname$: Observable<string>) => {
    return nickname$.pipe(
      switchMap(nickname =>
        this.gameOverHttpService.fetchPlayerLastGames(nickname).pipe(
          enableLoader,
          tapResponse(
            playerResult => this.addMyPlayerLastResult(playerResult),
            (error: HttpErrorResponse) => Logger.error(GameOverStore, error) // TODO error handling
          )
        )
      )
    );
  });

  constructor(private gameOverHttpService: GameOverHttpService) {
    super({
      leaderboard: null,
      myPlayerBestResult: null,
      myPlayerLastResult: null,
      currentPage: -1,
      allFetched: false,
      isListLoading: false,
    });
  }
}
