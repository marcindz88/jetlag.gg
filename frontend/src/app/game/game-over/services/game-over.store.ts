import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { GameStats, LeaderboardPlayerResult, LeaderboardResponse } from '@pg/game/game-over/models/game-over.models';
import { GameOverHttpService } from '@pg/game/game-over/services/game-over-http.service';
import { CONFIG } from '@shared/services/config.service';
import { Logger } from '@shared/services/logger.service';
import { Observable, of, switchMap } from 'rxjs';

export interface GameOverState {
  currentPage: number;
  leaderboard: LeaderboardResponse | null;
  myPlayerBestGame: LeaderboardPlayerResult | null;
  myPlayerLastGames: GameStats[] | null;
  allFetched: boolean;
  isListLoading: boolean;
}

@Injectable()
export class GameOverStore extends ComponentStore<GameOverState> {
  // SELECTORS
  readonly leaderboard$ = this.select(state => state.leaderboard);
  readonly myPlayerBestGame$ = this.select(state => state.myPlayerBestGame);
  readonly myPlayerLastGame$ = this.select(state => state.myPlayerLastGames?.[0] || null);
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

  private readonly addMyPlayerBestResult = this.updater((state, myPlayerBestResult: LeaderboardPlayerResult) => ({
    ...state,
    myPlayerBestGame: myPlayerBestResult,
  }));

  private readonly addMyPlayerLastGames = this.updater((state, myPlayerLastGames: GameStats[]) => ({
    ...state,
    myPlayerLastGames,
  }));

  private readonly addLeaderboardRows = this.updater((state, leaderboard: LeaderboardResponse) => ({
    ...state,
    leaderboard: {
      results: (state.leaderboard?.results || []).concat(leaderboard.results),
      total: leaderboard.total,
    },
    currentPage: state.currentPage + 1,
  }));

  // EFFECTS
  readonly getLeaderboardNextPage = this.effect(trigger$ => {
    return trigger$.pipe(
      switchMap(() => {
        if (this.get().allFetched) {
          return of(undefined);
        }

        const leaderboard = this.get().leaderboard;

        if (leaderboard && leaderboard.results.length >= leaderboard.total) {
          this.setAllFetched();
          return of(undefined);
        }

        this.setLoading(true);

        return this.gameOverHttpService
          .fetchLeaderboard(
            CONFIG.LEADERBOARD_TABLE_LENGTH,
            (this.get().currentPage + 1) * CONFIG.LEADERBOARD_TABLE_LENGTH
          )
          .pipe(
            tapResponse(
              (response: LeaderboardResponse) => {
                this.addLeaderboardRows(response);
                this.setLoading(false);
              },
              (error: HttpErrorResponse) => Logger.error(GameOverStore, error)
            )
          );
      })
    );
  });

  readonly getMyPlayerBest = this.effect((nickname$: Observable<string>) => {
    return nickname$.pipe(
      switchMap(nickname =>
        this.gameOverHttpService.fetchPlayerBest(nickname).pipe(
          tapResponse(
            playerResult => this.addMyPlayerBestResult(playerResult),
            (error: HttpErrorResponse) => Logger.error(GameOverStore, error)
          )
        )
      )
    );
  });

  readonly getMyPlayerLast = this.effect((nickname$: Observable<string>) => {
    return nickname$.pipe(
      switchMap(nickname =>
        this.gameOverHttpService.fetchPlayerLastGames(nickname).pipe(
          tapResponse(
            lastGames => this.addMyPlayerLastGames(lastGames),
            (error: HttpErrorResponse) => Logger.error(GameOverStore, error)
          )
        )
      )
    );
  });

  constructor(private gameOverHttpService: GameOverHttpService) {
    super({
      leaderboard: null,
      myPlayerBestGame: null,
      myPlayerLastGames: null,
      currentPage: -1,
      allFetched: false,
      isListLoading: false,
    });
  }
}
