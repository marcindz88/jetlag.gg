import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GameStats, LeaderboardPlayerResult, LeaderboardResponse } from '@pg/game/game-over/models/game-over.models';
import { EndpointsService } from '@shared/services/endpoints.service';
import { map, Observable } from 'rxjs';

@Injectable()
export class GameOverHttpService {
  constructor(private httpClient: HttpClient, private endpointsService: EndpointsService) {}

  fetchLeaderboard(limit: number, offset: number): Observable<LeaderboardResponse> {
    return this.httpClient.get<LeaderboardResponse>(this.endpointsService.getEndpoint('leaderboard'), {
      params: {
        limit,
        offset,
      },
    });
  }

  fetchPlayerBest(nickname: string): Observable<LeaderboardPlayerResult> {
    return this.httpClient.get<LeaderboardPlayerResult>(
      this.endpointsService.getEndpoint('leaderboard', { id: nickname }),
      {}
    );
  }

  fetchPlayerLastGame(nickname: string): Observable<GameStats | null> {
    return this.httpClient
      .get<GameStats[]>(this.endpointsService.getEndpoint('leaderboard_last_games', { id: nickname }), {
        params: { limit: 1 },
      })
      .pipe(map(games => games[0] || null));
  }
}
