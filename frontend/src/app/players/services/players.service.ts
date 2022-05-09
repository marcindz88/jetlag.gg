import { Injectable } from '@angular/core';
import { OtherPlayer } from '../models/player.types';
import { HttpClient } from '@angular/common/http';
import { EndpointsService } from '../../shared/services/endpoints.service';
import { WebsocketService } from '../../shared/services/websocket.service';
import { ServerMessageTypeEnum } from '../../shared/models/wss.types';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PlayersService {
  players$ = new BehaviorSubject<OtherPlayer[]>([]);

  constructor(
    private httpClient: HttpClient,
    private endpointsService: EndpointsService,
    private websocketService: WebsocketService
  ) {
    this.fetchPlayers();
    this.setPlayersUpdateHandler();
  }

  fetchPlayers() {
    this.httpClient.get<OtherPlayer[]>(this.endpointsService.getEndpoint('players')).subscribe(players => {
      this.players$.next(players);
    });
  }

  setPlayersUpdateHandler() {
    this.websocketService.playerMessages$.subscribe(playerMessage => {
      switch (playerMessage.type) {
        case ServerMessageTypeEnum.CONNECTED:
        case ServerMessageTypeEnum.REGISTERED:
        case ServerMessageTypeEnum.DISCONNECTED:
          this.updatePlayerStatus(playerMessage.data);
          break;
        case ServerMessageTypeEnum.REMOVED:
          this.removePlayerById(playerMessage.data.id);
          break;
      }
    });
  }

  updatePlayerStatus(player: OtherPlayer) {
    const existingPlayer = this.getPlayerById(player.id);
    if (existingPlayer) {
      this.players$.next(this.players$.value.map(oldPlayer => (oldPlayer.id === player.id ? player : oldPlayer)));
    } else {
      this.players$.next([...this.players$.value, player]);
    }
  }

  removePlayerById(id: string) {
    this.players$.next(this.players$.value.filter(player => player.id !== id));
  }

  getPlayerById(id: string): OtherPlayer | undefined {
    return this.players$.value.find(player => player.id === id);
  }
}
