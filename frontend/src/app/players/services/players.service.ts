import { Injectable } from '@angular/core';
import { OtherPlayer } from '../models/player.types';
import { HttpClient } from '@angular/common/http';
import { EndpointsService } from '../../shared/services/endpoints.service';
import { WebsocketService } from '../../shared/services/websocket.service';
import { ServerMessageTypeEnum } from '../../shared/models/wss.types';

@Injectable()
export class PlayersService {
  players: OtherPlayer[] = [];

  constructor(
    private httpClient: HttpClient,
    private endpointsService: EndpointsService,
    private websocketService: WebsocketService
  ) {
    this.fetchPlayers();
    this.setPlayersUpdateHandler();
  }

  fetchPlayers() {
    this.httpClient
      .get<OtherPlayer[]>(this.endpointsService.getEndpoint('players'))
      .subscribe(players => (this.players = players));
  }

  setPlayersUpdateHandler() {
    this.websocketService.playerMessages$.subscribe(playerMessage => {
      switch (playerMessage.type) {
        case ServerMessageTypeEnum.CONNECTED:
          this.updatePlayerStatus(playerMessage.data);
          break;
        case ServerMessageTypeEnum.REGISTERED:
          this.updatePlayerStatus(playerMessage.data);
          break;
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
      existingPlayer.connected = player.connected;
    } else {
      this.players.push(player);
    }
  }

  removePlayerById(id: string) {
    this.players = this.players.filter(player => player.id !== id);
  }

  getPlayerById(id: string): OtherPlayer | undefined {
    return this.players.find(player => player.id === id);
  }
}
