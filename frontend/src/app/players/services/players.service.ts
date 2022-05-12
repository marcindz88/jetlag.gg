import { Injectable } from '@angular/core';
import { OtherPlayer, PartialPlayerWithId } from '../models/player.types';
import { HttpClient } from '@angular/common/http';
import { EndpointsService } from '../../shared/services/endpoints.service';
import { WebsocketService } from '../../shared/services/websocket.service';
import { ClientMessageTypeEnum, ServerMessageTypeEnum } from '../../shared/models/wss.types';
import { BehaviorSubject } from 'rxjs';
import { ClockService } from '../../shared/services/clock.service';

@Injectable({ providedIn: 'root' })
export class PlayersService {
  players$ = new BehaviorSubject<OtherPlayer[]>([]);

  constructor(
    private httpClient: HttpClient,
    private endpointsService: EndpointsService,
    private websocketService: WebsocketService,
    private clockService: ClockService
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
          this.updatePlayer(playerMessage.data);
          break;
        case ServerMessageTypeEnum.REMOVED:
          this.removePlayerById(playerMessage.data.id);
          break;
        case ServerMessageTypeEnum.POSITION_UPDATED:
          this.updatePlayer(playerMessage.data);
          break;
      }
    });

    this.websocketService.playerPositionMessages$.subscribe(playerPositionMessage => {
      switch (playerPositionMessage.type) {
        case ServerMessageTypeEnum.POSITION_UPDATED:
          this.updatePlayer(playerPositionMessage.data);
          break;
      }
    });
  }

  updatePlayerAndEmitPositionUpdate(player: PartialPlayerWithId) {
    const updatedPlayer = this.updatePlayer(player);
    this.websocketService.sendWSSMessage({
      type: ClientMessageTypeEnum.POSITION_UPDATE_REQUEST,
      created: this.clockService.getCurrentTime(),
      data: {
        bearing: updatedPlayer.position.bearing,
        velocity: updatedPlayer.position.velocity,
        timestamp: this.clockService.getCurrentTime(),
      },
    });
  }

  updatePlayer(player: PartialPlayerWithId): OtherPlayer {
    const existingPlayer = this.getPlayerById(player.id);
    const updatedPlayer = { ...existingPlayer, ...player } as OtherPlayer;
    if (existingPlayer) {
      this.players$.next(
        this.players$.value.map(oldPlayer => (oldPlayer.id === player.id ? updatedPlayer : oldPlayer))
      );
    } else {
      this.players$.next([...this.players$.value, updatedPlayer]);
    }
    return updatedPlayer;
  }

  removePlayerById(id: string) {
    this.players$.next(this.players$.value.filter(player => player.id !== id));
  }

  getPlayerById(id: string): OtherPlayer | undefined {
    return this.players$.value.find(player => player.id === id);
  }
}
