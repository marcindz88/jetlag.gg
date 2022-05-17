import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { OtherPlayer } from '@pg/players/models/player.types';
import { enableLoader } from '@shared/operators/operators';
import { EndpointsService } from '@shared/services/endpoints.service';
import { WebsocketService } from '@shared/services/websocket.service';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';

import { User } from '../models/user.types';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  readonly playerKey = 'player';

  user$ = new BehaviorSubject<User | null>(null);

  constructor(
    private httpClient: HttpClient,
    private endpointsService: EndpointsService,
    private websocketService: WebsocketService
  ) {
    // TODO this.restoreUser();
  }

  createUser(nickname: string): Observable<User> {
    return this.httpClient.post<User & OtherPlayer>(this.endpointsService.getEndpoint('players'), { nickname }).pipe(
      enableLoader,
      map(({ connected: _, position: _1, ...player }) => ({ ...player, nickname })),
      tap(this.setUser.bind(this))
    );
  }

  resetUser() {
    this.user$.next(null);
    localStorage.removeItem(this.playerKey);
  }

  setUser(user: User) {
    this.user$.next(user);
    // TEMP localStorage.setItem(this.playerKey, JSON.stringify(user));
    this.websocketService.createWSSConnection(user.token);
  }

  restoreUser() {
    const userFromStorage = localStorage.getItem(this.playerKey);
    if (userFromStorage) {
      const user = JSON.parse(userFromStorage) as User;
      this.user$.next(user);
      this.createUser(user.nickname).subscribe({
        error: () => {
          this.websocketService.createWSSConnection(user.token);
        },
      });
    }
  }
}
