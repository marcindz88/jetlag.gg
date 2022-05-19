import { Injectable } from '@angular/core';
import { OtherPlayer, PlayerPositionUpdate } from '@pg/players/models/player.types';
import { Logger } from '@shared/services/logger.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

import {
  ClientMessageTypeEnum,
  ClockMessageDataType,
  Message,
  MessageDataType,
  MessageTypeEnum,
} from '../models/wss.types';
import { EndpointsService } from './endpoints.service';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  playerMessages$: Subject<Message<OtherPlayer>> = new Subject();
  playerPositionMessages$: Subject<Message<PlayerPositionUpdate>> = new Subject();
  clockMessages$: Subject<Message<ClockMessageDataType>> = new Subject();
  isConnected$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private webSocket: WebSocketSubject<Message<MessageDataType, MessageTypeEnum>> | null = null;
  private closedCounter = 0;

  constructor(private es: EndpointsService) {}

  createWSSConnection(token: string): void {
    Logger.log(WebsocketService, 'OPENING NEW WSS CONNECTION');
    this.webSocket = webSocket({
      url: this.es.getWebSocketEndpoint(),
      protocol: [token],
      openObserver: {
        next: () => {
          Logger.log(WebsocketService, 'WSS CONNECTED');
          this.isConnected$.next(true);
        },
      },
      closeObserver: {
        next: () => {
          Logger.log(WebsocketService, 'WSS CLOSED');
          this.isConnected$.next(false);
        },
      },
    });
    this.isConnected$.next(true);
    this.webSocket.subscribe({
      next: message => {
        if (message.type.startsWith('player_position')) {
          this.playerPositionMessages$.next(message as Message<PlayerPositionUpdate>);
          return;
        }
        if (message.type.startsWith('player')) {
          this.playerMessages$.next(message as Message<OtherPlayer>);
          return;
        }
        if (message.type.startsWith('clock')) {
          this.clockMessages$.next(message as Message<ClockMessageDataType>);
          return;
        }
      },
      error: err => {
        Logger.error(WebsocketService, `WSS ERROR ${err as string}`);
        this.tryToReconnect(token);
      },
      complete: () => {
        Logger.warn(WebsocketService, 'WSS CONNECTION CLOSED');
        this.tryToReconnect(token);
      },
    });
  }

  sendWSSMessage(message: Message<MessageDataType, ClientMessageTypeEnum>): void {
    if (this.webSocket) {
      this.webSocket.next(message);
    } else {
      Logger.error(WebsocketService, 'No WSS connection available');
    }
  }

  closeWSSConnection(): void {
    this.closeConnection();
  }

  private closeConnection(): void {
    if (this.webSocket) {
      this.webSocket.complete();
      this.webSocket = null;
    }
  }

  private tryToReconnect(token: string): void {
    setTimeout(() => {
      this.closedCounter++;
      this.closeConnection();
      this.createWSSConnection(token);
    }, 5000 * this.closedCounter);
  }
}
