import { Injectable } from '@angular/core';
import { MyPlayer } from '../models/player.types';
import { HttpClient } from '@angular/common/http';
import { EndpointsService } from '../../shared/services/endpoints.service';
import { WebsocketService } from '../../shared/services/websocket.service';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MyPlayerService {
  readonly playerKey = 'player';

  player: MyPlayer | null = null;

  constructor(
    private httpClient: HttpClient,
    private endpointsService: EndpointsService,
    private websocketService: WebsocketService
  ) {
    this.restoreUser();
  }

  createUser(nickname: string): Observable<MyPlayer> {
    return this.httpClient
      .post<MyPlayer>(this.endpointsService.getEndpoint('players'), { nickname })
      .pipe(tap(this.setUser.bind(this)));
  }

  resetUser() {
    this.player = null;
    localStorage.removeItem(this.playerKey);
  }

  setUser(player: MyPlayer) {
    this.player = player;
    localStorage.setItem(this.playerKey, JSON.stringify(player));
    this.websocketService.createWSSConnection(this.player.token);
  }

  restoreUser() {
    const playerFromStorage = localStorage.getItem(this.playerKey);
    if (playerFromStorage) {
      this.player = JSON.parse(playerFromStorage) as MyPlayer;
      // TODO save player data backend
      this.createUser(this.player.nickname);
    }
  }
}
