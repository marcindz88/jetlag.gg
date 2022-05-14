import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UserService } from '@auth/services/user.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ClientMessageTypeEnum, ServerMessageTypeEnum } from '@shared/models/wss.types';
import { ClockService } from '@shared/services/clock.service';
import { EndpointsService } from '@shared/services/endpoints.service';
import { WebsocketService } from '@shared/services/websocket.service';
import { BehaviorSubject, Subject } from 'rxjs';

import { Player } from '../models/player';
import { OtherPlayer, PartialPlayerWithId } from '../models/player.types';

@UntilDestroy()
@Injectable()
export class PlayersService {
  players = new Map<string, Player>();
  myPlayer: Player | null = null;
  loading$ = new BehaviorSubject<boolean>(true);
  changed$ = new Subject<void>();

  constructor(
    private httpClient: HttpClient,
    private endpointsService: EndpointsService,
    private websocketService: WebsocketService,
    private clockService: ClockService,
    private userService: UserService
  ) {
    this.setPlayersUpdateHandler();
  }

  fetchPlayers() {
    this.httpClient
      .get<OtherPlayer[]>(this.endpointsService.getEndpoint('players'))
      .pipe(untilDestroyed(this))
      .subscribe(players => {
        players.forEach(this.addPlayer.bind(this));
        this.myPlayer = this.players.get(this.userService.user$.value!.id)!;
        this.loading$.next(false);
        this.changed$.next();
      });
  }

  setPlayersUpdateHandler() {
    this.websocketService.playerMessages$.pipe(untilDestroyed(this)).subscribe(playerMessage => {
      switch (playerMessage.type) {
        case ServerMessageTypeEnum.REGISTERED:
          this.addPlayer(playerMessage.data);
          break;
        case ServerMessageTypeEnum.CONNECTED:
        case ServerMessageTypeEnum.DISCONNECTED:
          this.updatePlayer(playerMessage.data);
          break;
        case ServerMessageTypeEnum.REMOVED:
          this.players.delete(playerMessage.data.id);
          break;
      }
      this.changed$.next();
    });

    this.websocketService.playerPositionMessages$.pipe(untilDestroyed(this)).subscribe(playerPositionMessage => {
      switch (playerPositionMessage.type) {
        case ServerMessageTypeEnum.POSITION_UPDATED:
          this.updatePlayer(playerPositionMessage.data);
          break;
      }
      this.changed$.next();
    });
  }

  emitPlayerPositionUpdate(player: Player) {
    this.websocketService.sendWSSMessage({
      type: ClientMessageTypeEnum.POSITION_UPDATE_REQUEST,
      created: this.clockService.getCurrentTime(),
      data: {
        bearing: player.bearing,
        velocity: player.velocity,
        timestamp: this.clockService.getCurrentTime(),
      },
    });
  }

  updatePlayer(playerData: PartialPlayerWithId | OtherPlayer) {
    this.players.get(playerData.id)?.updatePlayer(playerData);
  }

  addPlayer(player: OtherPlayer) {
    this.players.set(player.id, new Player(player));
  }
}
