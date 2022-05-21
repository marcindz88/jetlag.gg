import { Injectable } from '@angular/core';
import { Logger } from '@shared/services/logger.service';
import { BehaviorSubject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

import { ClientMessage, ServerMessage } from '../models/wss.types';
import { EndpointsService } from './endpoints.service';

@Injectable()
export abstract class AbstractWebsocketService<S extends ServerMessage, C extends ClientMessage> {
  isConnected$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  protected url = 'ws';
  private webSocket: WebSocketSubject<S | C> | null = null;
  private closedCounter = 0;

  protected constructor(protected es: EndpointsService) {}

  sendWSSMessage(message: C): void {
    if (this.webSocket) {
      this.webSocket.next(message);
    } else {
      Logger.error(this.class, 'No WSS connection available');
    }
  }

  protected abstract get class(): { name: string };
  protected abstract messagesHandler(message: S | C): void;

  protected openHandler() {
    Logger.log(this.class, 'WSS CONNECTED');
    this.isConnected$.next(true);
  }

  protected closeHandler() {
    Logger.log(this.class, 'WSS CLOSED');
    this.isConnected$.next(false);
  }

  protected createWSSConnection(token?: string): void {
    Logger.log(this.class, 'OPENING NEW WSS CONNECTION');
    this.webSocket = webSocket({
      url: this.es.getWebSocketEndpoint(this.url),
      protocol: token ? [token] : undefined,
      openObserver: {
        next: this.openHandler.bind(this),
      },
      closeObserver: {
        next: this.closeHandler.bind(this),
      },
    });
    this.isConnected$.next(true);
    this.webSocket.subscribe({
      next: this.messagesHandler.bind(this),
      error: err => {
        Logger.error(this.class, `WSS ERROR ${err as string}`);
        this.tryToReconnect(token);
      },
      complete: () => {
        Logger.warn(this.class, 'WSS CONNECTION CLOSED');
        this.tryToReconnect(token);
      },
    });
  }

  protected closeWSSConnection(): void {
    this.closeConnection();
  }

  private closeConnection(): void {
    if (this.webSocket) {
      this.webSocket.complete();
      this.webSocket = null;
    }
  }

  private tryToReconnect(token?: string): void {
    setTimeout(() => {
      this.closedCounter++;
      this.closeConnection();
      this.createWSSConnection(token);
    }, 5000 * this.closedCounter);
  }
}
