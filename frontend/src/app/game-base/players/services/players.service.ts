import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
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

  constructor(
    private mainWebsocketService: MainWebsocketService,
    private clockService: ClockService,
    private matSnackbar: MatSnackBar
  ) {}

  setPlayersUpdateHandler(userId: string) {
    this.mainWebsocketService.playerMessages$.pipe(untilDestroyed(this)).subscribe(playerMessage => {
      switch (playerMessage.type) {
        case ServerMessageTypeEnum.PLAYER_LIST:
          this.savePlayersList(playerMessage.data as PlayerList, userId);
          break;
        case ServerMessageTypeEnum.PLAYER_REGISTERED:
          this.addPlayer(playerMessage.data as OtherPlayer);
          break;
        case ServerMessageTypeEnum.PLAYER_CONNECTED:
        case ServerMessageTypeEnum.PLAYER_UPDATED:
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
    });
  }

  emitPlayerPositionUpdate(player: Player) {
    this.mainWebsocketService.sendWSSMessage({
      type: ClientMessageTypeEnum.PLAYER_POSITION_UPDATE_REQUEST,
      created: this.clockService.getCurrentTime(),
      data: player.position,
    });
  }

  private savePlayersList(playersList: PlayerList, myUserId: string) {
    playersList.players.forEach(player => this.addPlayer(player, player.id === myUserId));
  }

  updatePlayer(playerData: PartialPlayerWithId | OtherPlayer) {
    this.players.get(playerData.id)?.updatePlayer(playerData);
  }

  addPlayer(player: OtherPlayer, isMyPlayer = false) {
    // If player has been already setup then don't override
    if (!this.players.get(player.id)) {
      const newPlayer = new Player(player, isMyPlayer, this.clockService, this.matSnackbar);
      this.players.set(player.id, newPlayer);

      if (isMyPlayer) {
        this.myPlayer = newPlayer;
      }
    }
  }
}
