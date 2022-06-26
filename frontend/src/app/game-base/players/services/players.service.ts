import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ClientMessageTypeEnum, ServerMessageTypeEnum } from '@shared/models/wss.types';
import { ClockService } from '@shared/services/clock.service';
import { MainWebsocketService } from '@shared/services/main-websocket.service';
import { NotificationService } from '@shared/services/notification.service';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';

import { Player } from '../models/player';
import { OtherPlayer, PartialPlayerWithId, PlayerList } from '../models/player.types';

@UntilDestroy()
@Injectable({ providedIn: 'root' })
export class PlayersService {
  players = new Map<string, Player>();
  playersSorted$ = new BehaviorSubject<Player[]>([]);
  playersLeaderboard$ = new Observable<OtherPlayer[]>(); // TODO
  myPlayer: Player | null = null;
  changed$ = new ReplaySubject<void>();

  constructor(
    private mainWebsocketService: MainWebsocketService,
    private clockService: ClockService,
    private notificationService: NotificationService
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
          this.removePlayer(playerMessage.data as OtherPlayer);
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
    playersList.players.forEach(player => this.addPlayer(player, player.id === myUserId, true));
    this.updateSortedPlayers();
  }

  private updatePlayer(playerData: PartialPlayerWithId | OtherPlayer) {
    this.players.get(playerData.id)?.updatePlayer(playerData);

    if (playerData.score) {
      this.updateSortedPlayers();
    }
  }

  private addPlayer(player: OtherPlayer, isMyPlayer = false, isInitial = false) {
    // If player has been already setup then don't override
    if (!this.players.get(player.id)) {
      const newPlayer = new Player(player, isMyPlayer, this.clockService, this.notificationService);
      this.players.set(player.id, newPlayer);

      if (isMyPlayer) {
        this.myPlayer = newPlayer;
      } else if (!isInitial) {
        this.notificationService.openNotification(
          {
            text: `${newPlayer.isBot ? 'Bot' : 'Player'} ${newPlayer.nickname} has just joined the game`,
            icon: 'person_add',
          },
          { duration: 3000 }
        );
      }

      this.updateSortedPlayers();
    }
  }

  private removePlayer(player: OtherPlayer) {
    this.players.delete(player.id);
    this.playersSorted$.next(this.playersSorted$.value.filter(p => p.id !== player.id));

    this.notificationService.openNotification(
      {
        text: `${player.is_bot ? 'Bot' : 'Player'} ${player.nickname} has left the game`,
        icon: 'person_off',
      },
      { duration: 3000 }
    );
  }

  private updateSortedPlayers() {
    this.playersSorted$.next(Array.from(this.players.values()).sort((a, b) => b.score - a.score));
  }
}
