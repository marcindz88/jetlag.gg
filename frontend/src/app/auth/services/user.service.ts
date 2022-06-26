import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AirportsService } from '@pg/game-base/airports/services/airports.service';
import { OtherPlayer } from '@pg/game-base/players/models/player.types';
import { PlayersService } from '@pg/game-base/players/services/players.service';
import { enableLoader } from '@shared/operators/operators';
import { EndpointsService } from '@shared/services/endpoints.service';
import { MainWebsocketService } from '@shared/services/main-websocket.service';
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
    private mainWebsocketService: MainWebsocketService,
    private playersService: PlayersService,
    private airportService: AirportsService
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

  resetUser(): void {
    this.user$.next(null);
    this.mainWebsocketService.closeGameWebsocket();
    this.airportService.resetAll();
    this.playersService.resetAll();
  }

  setUser(user: User) {
    this.user$.next(user);
    // TEMP localStorage.setItem(this.playerKey, JSON.stringify(user));
    this.mainWebsocketService.setupGameWebsocket(user.token);
    this.playersService.setPlayersUpdateHandler(user.id);
    this.airportService.setAirportsUpdateHandler();
  }

  restoreUser() {
    const userFromStorage = localStorage.getItem(this.playerKey);
    if (userFromStorage) {
      const user = JSON.parse(userFromStorage) as User;
      this.user$.next(user);
      this.createUser(user.nickname).subscribe({
        error: () => {
          this.mainWebsocketService.setupGameWebsocket(user.token);
        },
      });
    }
  }
}
