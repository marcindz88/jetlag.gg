import { Injectable } from '@angular/core';
import { MyPlayer } from '../models/player.types';
import { HttpClient } from '@angular/common/http';
import { EndpointsService } from '../../shared/services/endpoints.service';
import { WebsocketService } from '../../shared/services/websocket.service';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MyPlayerService {
  readonly playerKey = 'player';

  player$ = new BehaviorSubject<MyPlayer | null>(null);

  constructor(
    private httpClient: HttpClient,
    private endpointsService: EndpointsService,
    private websocketService: WebsocketService
  ) {
    this.restoreUser();
  }

  createUser(nickname: string): Observable<MyPlayer> {
    return this.httpClient.post<MyPlayer>(this.endpointsService.getEndpoint('players'), { nickname }).pipe(
      map(player => ({ ...player, nickname })),
      tap(this.setUser.bind(this))
    );
  }

  resetUser() {
    this.player$.next(null);
    localStorage.removeItem(this.playerKey);
  }

  setUser(player: MyPlayer) {
    this.player$.next(player);
    // TEMP localStorage.setItem(this.playerKey, JSON.stringify(player));
    this.websocketService.createWSSConnection(player.token);
  }

  restoreUser() {
    const playerFromStorage = localStorage.getItem(this.playerKey);
    if (playerFromStorage) {
      const myPlayer = JSON.parse(playerFromStorage) as MyPlayer;
      this.player$.next(myPlayer);
      this.createUser(myPlayer.nickname).subscribe({
        error: () => {
          this.websocketService.createWSSConnection(myPlayer.token);
        },
      });
    }
  }
}
