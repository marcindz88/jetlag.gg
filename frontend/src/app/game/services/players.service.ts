import { Injectable } from '@angular/core';
import { DeathCausePipe } from '@pg/game/game-shared/pipes/death-cause.pipe';
import { NicknamePipe } from '@pg/game/game-shared/pipes/nickname.pipe';
import { GameWebsocketService } from '@pg/game/services/game-websocket.service';
import { NotificationComponent } from '@shared/components/notification/notification.component';
import { ClientMessageTypeEnum, ServerMessageTypeEnum } from '@shared/models/wss.types';
import { ClockService } from '@shared/services/clock.service';
import { NotificationService } from '@shared/services/notification.service';
import { QueueBarRef } from 'ngx-mat-queue-bar/lib/queue-bar-ref';
import { BehaviorSubject, filter, ReplaySubject, Subject, take, takeUntil } from 'rxjs';

import { Player } from '../models/player';
import {
  DeathCauseEnum,
  OtherPlayer,
  PartialPlayerWithId,
  PlaneExtendedPosition,
  PlayerList,
} from '../models/player.types';

@Injectable()
export class PlayersService {
  players = new Map<string, Player>();
  playersSorted$ = new BehaviorSubject<Player[]>([]);
  myPlayer: Player | null = null;
  changed$ = new ReplaySubject<void>();
  reset$ = new Subject<void>();

  private disconnectedNotificationRef?: QueueBarRef<NotificationComponent>;

  constructor(
    private mainWebsocketService: GameWebsocketService,
    private clockService: ClockService,
    private notificationService: NotificationService,
    private deathCausePipe: DeathCausePipe,
    private nicknamePipe: NicknamePipe
  ) {}

  resetAll() {
    this.players.clear();
    this.playersSorted$.next([]);
    this.myPlayer = null;
    this.reset$.next();
  }

  setPlayersUpdateHandler(userId: string) {
    this.handleWSSDisconnection();

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

  emitPlayerPositionUpdate(position: PlaneExtendedPosition) {
    this.mainWebsocketService.sendWSSMessage({
      type: ClientMessageTypeEnum.PLAYER_POSITION_UPDATE_REQUEST,
      created: this.clockService.getCurrentTime(),
      data: position,
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
            text: `${newPlayer.isBot ? 'Bot' : 'Player'} ${this.nicknamePipe.transform(
              newPlayer.nickname
            )} has just joined the game`,
            icon: 'person_add',
          },
          { duration: 3000 }
        );
      }

      this.updateSortedPlayers();
    }
  }

  private removePlayer(player: OtherPlayer) {
    const foundPlayer = this.players.get(player.id);
    if (!foundPlayer) {
      return;
    }

    // If plane is not crashing remove instantly
    if (!foundPlayer.isCrashing) {
      foundPlayer.destroy();
      this.removePlayerFromMapsAndNotify(foundPlayer);
      return;
    }

    // Else remove after has crashed
    foundPlayer.changeNotifiers.destroy$
      .pipe(takeUntil(this.reset$), take(1))
      .subscribe(() => this.removePlayerFromMapsAndNotify(foundPlayer));
  }

  private removePlayerFromMapsAndNotify(player: Player) {
    this.players.delete(player.id);
    this.playersSorted$.next(this.playersSorted$.value.filter(p => p.id !== player.id));

    if (!player.isMyPlayer) {
      this.notificationService.openNotification(
        {
          text: `${player.isBot ? 'Bot' : 'Player'} ${this.nicknamePipe.transform(
            player.nickname
          )} ${this.deathCausePipe.transform(player.deathCause, 'message3rdperson')}`,
          icon: 'person_off',
        },
        { duration: 3000 }
      );
    }
  }

  private updateSortedPlayers() {
    this.playersSorted$.next(Array.from(this.players.values()).sort((a, b) => b.score - a.score));
  }

  private handleWSSDisconnection() {
    this.mainWebsocketService.isConnected$
      .pipe(
        takeUntil(
          this.changed$.pipe(filter(() => !this.myPlayer || this.myPlayer.isCrashing || this.myPlayer.isCrashed))
        ),
        takeUntil(this.reset$)
      )
      .subscribe(isConnected => {
        if (this.myPlayer && this.myPlayer.connected !== isConnected) {
          this.myPlayer.connected = isConnected;
          this.changed$.next();
        }

        if (isConnected) {
          if (this.disconnectedNotificationRef) {
            this.dismissDisconnectedNotification();
          }
          return;
        }

        if (!this.disconnectedNotificationRef) {
          this.disconnectedNotificationRef = this.notificationService.openNotification(
            {
              text: 'Connection lost, check your internet',
              icon: 'signal_disconnected',
              style: 'error',
            },
            { duration: 0 }
          );
        }
      });

    this.mainWebsocketService.unableToConnect$.subscribe(() => {
      this.dismissDisconnectedNotification();
      this.myPlayer?.updatePlayer({ death_cause: DeathCauseEnum.DISCONNECTED });
    });
  }

  private dismissDisconnectedNotification() {
    if (this.disconnectedNotificationRef) {
      this.disconnectedNotificationRef.dismiss();
      this.disconnectedNotificationRef = undefined;
    }
  }
}
