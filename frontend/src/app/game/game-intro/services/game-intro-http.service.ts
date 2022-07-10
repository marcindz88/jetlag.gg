import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '@auth/models/user.types';
import { GameStats } from '@pg/game/game-over/models/game-over.models';
import { OtherPlayer } from '@pg/game/models/player.types';
import { EndpointsService } from '@shared/services/endpoints.service';
import { Observable } from 'rxjs';

@Injectable()
export class GameIntroHttpService {
  constructor(private httpClient: HttpClient, private endpointsService: EndpointsService) {}

  fetchPlayerLastGames(nickname: string): Observable<GameStats[]> {
    return this.httpClient.get<GameStats[]>(
      this.endpointsService.getEndpoint('leaderboard_last_games', { id: nickname }),
      {}
    );
  }

  join(): Observable<User & OtherPlayer> {
    return this.httpClient.post<User & OtherPlayer>(this.endpointsService.getEndpoint('join'), {});
  }
}
