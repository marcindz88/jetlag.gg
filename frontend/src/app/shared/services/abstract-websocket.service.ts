import { Injectable, OnDestroy } from '@angular/core';
import { Logger } from '@shared/services/logger.service';
import { BehaviorSubject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

import { ClientMessage, ServerMessage } from '../models/wss.types';
import { EndpointsService } from './endpoints.service';

const PING_MESSAGE = 'ping';
const PONG_MESSAGE = 'pong';
const MAX_PING_AWAITING_TIME = 4000;

@Injectable()
export abstract class AbstractWebsocketService<S extends ServerMessage, C extends ClientMessage> implements OnDestroy {
  isConnected$ = new BehaviorSubject<boolean>(false);

  protected url = 'ws';

  private webSocket: WebSocketSubject<S | C | string> | null = null;
  private token?: string;
  private closedCounter = 0;
  private isClosedCleanly = false;
  private pingTimeout?: number;

  constructor(protected es: EndpointsService) {}

  public sendWSSMessage(message: C | string): void {
    if (this.webSocket) {
      this.webSocket.next(message);
    } else {
      Logger.error(this.class, 'No WSS connection available');
    }
  }

  // Token is only required when connecting for the first time and endpoint is restricted
  public connect(token?: string) {
    this.token = this.token || token;
    this.closedCounter = 0;
    this.isClosedCleanly = false;

    this.createWSSConnection();
  }

  public disconnect() {
    this.isClosedCleanly = true;
    this.clearPingTimeout();
    this.closeConnection();
  }

  ngOnDestroy(): void {
    this.closeConnection();
  }

  protected abstract get class(): { name: string };
  protected abstract messagesHandler(message: S | C): void;

  protected openHandler() {
    Logger.log(this.class, 'WSS CONNECTED');
    this.isClosedCleanly = false;
    this.isConnected$.next(true);
  }

  protected closeHandler(event: CloseEvent) {
    this.isConnected$.next(false);

    if (event.code === 1000) {
      Logger.log(this.class, 'WSS CLOSED CORRECTLY');
      this.isClosedCleanly = true;
    } else if (!this.isClosedCleanly) {
      Logger.warn(this.class, 'WSS CLOSED INCORRECTLY');
      this.tryToReconnect();
    }
  }

  protected createWSSConnection(): void {
    Logger.log(this.class, 'OPENING NEW WSS CONNECTION');

    this.webSocket = this.createWebsocketClient();

    this.webSocket.subscribe({
      next: this.nextHandler.bind(this),
      error: this.errorHandler.bind(this),
    });
  }

  private createWebsocketClient(): WebSocketSubject<S | C | string> {
    return webSocket({
      url: this.es.getWebSocketEndpoint(this.url),
      protocol: this.token ? [this.token] : undefined,
      deserializer: this.deserializer.bind(this),
      serializer: this.serializer.bind(this),
      openObserver: {
        next: this.openHandler.bind(this),
      },
      closeObserver: {
        next: event => this.closeHandler(event),
      },
    });
  }

  private deserializer(message: MessageEvent<string>): S | C | string {
    if (message.data === PING_MESSAGE) {
      return message.data;
    }
    return JSON.parse(message.data) as S | C;
  }

  private serializer(message: S | C | string): string {
    if (message === PONG_MESSAGE) {
      return message;
    }
    return JSON.stringify(message);
  }

  private errorHandler(err: string): void {
    Logger.error(this.class, `WSS ERROR`, err);
  }

  private nextHandler(message: S | C | string): void {
    if (typeof message === 'string' && message === PING_MESSAGE) {
      this.handlePingMessage();
      return;
    }

    this.messagesHandler(message as S | C);
  }

  private handlePingMessage(): void {
    this.clearPingTimeout();
    this.sendWSSMessage(PONG_MESSAGE);

    this.pingTimeout = setTimeout(() => {
      this.closeConnection();
      this.createWSSConnection();
    }, MAX_PING_AWAITING_TIME);
  }

  private clearPingTimeout() {
    if (this.pingTimeout !== undefined) {
      clearTimeout(this.pingTimeout);
      this.pingTimeout = undefined;
    }
  }

  private closeConnection(): void {
    if (this.webSocket) {
      this.webSocket.complete();
      this.webSocket = null;
    }
  }

  private tryToReconnect(): void {
    if (!this.isClosedCleanly) {
      setTimeout(() => {
        if (!this.isClosedCleanly) {
          this.closedCounter++;
          this.closeConnection();
          this.createWSSConnection();
        }
      }, 5000 * this.closedCounter);
    }
  }
}
