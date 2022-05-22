import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ClientMessageTypeEnum, ServerMessageTypeEnum } from '@shared/models/wss.types';
import { ClockService } from '@shared/services/clock.service';
import { MainWebsocketService } from '@shared/services/main-websocket.service';
import { ReplaySubject } from 'rxjs';

import { Player } from '../models/player';
import { OtherPlayer, PartialPlayerWithId, PlayerList } from '../models/player.types';

@UntilDestroy()
@Injectable({ providedIn: 'root' })
export class PlayersService {
  players = new Map<string, Player>();
  myPlayer: Player | null = null;
  changed$ = new ReplaySubject<void>();

  constructor(private mainWebsocketService: MainWebsocketService, private clockService: ClockService) {}

  setPlayersUpdateHandler(userId: string) {
    this.mainWebsocketService.playerMessages$.pipe(untilDestroyed(this)).subscribe(playerMessage => {
      switch (playerMessage.type) {
        case ServerMessageTypeEnum.PLAYER_LIST:
          this.savePlayersList(playerMessage.data as PlayerList);
          this.myPlayer = this.players.get(userId)!;
          break;
        case ServerMessageTypeEnum.PLAYER_REGISTERED:
          this.addPlayer(playerMessage.data as OtherPlayer);
          break;
        case ServerMessageTypeEnum.PLAYER_CONNECTED:
        case ServerMessageTypeEnum.PLAYER_DISCONNECTED:
          this.updatePlayer(playerMessage.data as OtherPlayer);
          break;
        case ServerMessageTypeEnum.PLAYER_REMOVED:
          this.players.delete((playerMessage.data as OtherPlayer).id);
          break;
      }
      this.changed$.next();
    });

    this.mainWebsocketService.playerPositionMessages$.pipe(untilDestroyed(this)).subscribe(playerPositionMessage => {
      switch (playerPositionMessage.type) {
        case ServerMessageTypeEnum.PLAYER_POSITION_UPDATED:
          this.updatePlayer(playerPositionMessage.data);
          break;
      }
      this.changed$.next();
    });
  }

  emitPlayerPositionUpdate(player: Player) {
    this.mainWebsocketService.sendWSSMessage({
      type: ClientMessageTypeEnum.PLAYER_POSITION_UPDATE_REQUEST,
      created: this.clockService.getCurrentTime(),
      data: player.position,
    });
  }

  private savePlayersList(playersList: PlayerList) {
    playersList.players.forEach(this.addPlayer.bind(this));
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
