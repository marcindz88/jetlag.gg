import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LeaderboardPlayerResult, LeaderboardResponse } from '@pg/game/game-over/models/game-over.models';
import { EndpointsService } from '@shared/services/endpoints.service';
import { Observable } from 'rxjs';

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

  fetchPlayerLastGames(nickname: string): Observable<LeaderboardPlayerResult> {
    return this.httpClient.get<LeaderboardPlayerResult>(
      this.endpointsService.getEndpoint('leaderboard_last_games', { id: nickname }),
      {}
    );
  }
}
