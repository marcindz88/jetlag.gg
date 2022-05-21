import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UserService } from '@auth/services/user.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ClientMessageTypeEnum, ServerMessageTypeEnum } from '@shared/models/wss.types';
import { enableLoader } from '@shared/operators/operators';
import { ClockService } from '@shared/services/clock.service';
import { EndpointsService } from '@shared/services/endpoints.service';
import { MainWebsocketService } from '@shared/services/main-websocket.service';
import { Subject } from 'rxjs';

import { Player } from '../models/player';
import { OtherPlayer, PartialPlayerWithId } from '../models/player.types';

@UntilDestroy()
@Injectable()
export class PlayersService {
  players = new Map<string, Player>();
  myPlayer: Player | null = null;
  changed$ = new Subject<void>();

  constructor(
    private httpClient: HttpClient,
    private endpointsService: EndpointsService,
    private mainWebsocketService: MainWebsocketService,
    private clockService: ClockService,
    private userService: UserService
  ) {
    this.fetchPlayers();
    this.setPlayersUpdateHandler();
  }

  fetchPlayers() {
    this.httpClient
      .get<OtherPlayer[]>(this.endpointsService.getEndpoint('players'))
      .pipe(untilDestroyed(this), enableLoader)
      .subscribe(players => {
        players.forEach(this.addPlayer.bind(this));
        this.myPlayer = this.players.get(this.userService.user$.value!.id)!;
        this.changed$.next();
      });
  }

  setPlayersUpdateHandler() {
    this.mainWebsocketService.playerMessages$.pipe(untilDestroyed(this)).subscribe(playerMessage => {
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

    this.mainWebsocketService.playerPositionMessages$.pipe(untilDestroyed(this)).subscribe(playerPositionMessage => {
      switch (playerPositionMessage.type) {
        case ServerMessageTypeEnum.POSITION_UPDATED:
          this.updatePlayer(playerPositionMessage.data);
          break;
      }
      this.changed$.next();
    });
  }

  emitPlayerPositionUpdate(player: Player) {
    this.mainWebsocketService.sendWSSMessage({
      type: ClientMessageTypeEnum.POSITION_UPDATE_REQUEST,
      created: this.clockService.getCurrentTime(),
      data: player.position,
    });
  }

  updatePlayer(playerData: PartialPlayerWithId | OtherPlayer) {
    this.players.get(playerData.id)?.updatePlayer(playerData);
  }

  addPlayer(player: OtherPlayer) {
    // If player has been already setup by wss then don't override
    if (!this.players.get(player.id)) {
      this.players.set(player.id, new Player(player, this.clockService));
    }
  }
}
