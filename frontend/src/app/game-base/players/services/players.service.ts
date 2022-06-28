import { Injectable } from '@angular/core';
import { ClientMessageTypeEnum, ServerMessageTypeEnum } from '@shared/models/wss.types';
import { ClockService } from '@shared/services/clock.service';
import { MainWebsocketService } from '@shared/services/main-websocket.service';
import { NotificationService } from '@shared/services/notification.service';
import { BehaviorSubject, ReplaySubject, Subject, takeUntil } from 'rxjs';

import { Player } from '../models/player';
import { OtherPlayer, PartialPlayerWithId, PlayerList } from '../models/player.types';

@Injectable({ providedIn: 'root' })
export class PlayersService {
  players = new Map<string, Player>();
  playersSorted$ = new BehaviorSubject<Player[]>([]);
  myPlayer: Player | null = null;
  changed$ = new ReplaySubject<void>();
  reset$ = new Subject<void>();

  constructor(
    private mainWebsocketService: MainWebsocketService,
    private clockService: ClockService,
    private notificationService: NotificationService
  ) {}

  resetAll() {
    this.players = new Map<string, Player>();
    this.playersSorted$ = new BehaviorSubject<Player[]>([]);
    this.myPlayer = null;
    this.changed$ = new ReplaySubject<void>();
    this.reset$.next();
  }

  setPlayersUpdateHandler(userId: string) {
    this.mainWebsocketService.playerMessages$.pipe(takeUntil(this.reset$)).subscribe(playerMessage => {
      switch (playerMessage.type) {
        case ServerMessageTypeEnum.PLAYER_LIST:
          this.savePlayersList(playerMessage.data as PlayerList, userId);
          break;
        case ServerMessageTypeEnum.PLAYER_REGISTERED:
          this.addPlayer(playerMessage.data as OtherPlayer, userId);
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

    this.mainWebsocketService.playerPositionMessages$.pipe(takeUntil(this.reset$)).subscribe(playerPositionMessage => {
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
      data: player.currentPosition,
    });
  }

  private savePlayersList(playersList: PlayerList, myUserId: string) {
    playersList.players.forEach(player => this.addPlayer(player, myUserId, true));
    this.updateSortedPlayers();
  }

  private updatePlayer(playerData: PartialPlayerWithId | OtherPlayer) {
    this.players.get(playerData.id)?.updatePlayer(playerData);

    if (playerData.score) {
      this.updateSortedPlayers();
    }
  }

  private addPlayer(player: OtherPlayer, myUserId: string, isInitial = false) {
    // If player has been already setup then don't override
    if (!this.players.get(player.id)) {
      const isMyPlayer = myUserId === player.id;
      const newPlayer = new Player(player, isMyPlayer, this.clockService);
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
    this.players.get(player.id)?.destroy();
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
