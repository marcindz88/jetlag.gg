import { Injectable, OnDestroy } from '@angular/core';
import { Logger } from '@shared/services/logger.service';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

import { ClientMessage, ServerMessage, WSSConfig, WSSConfigServerMessage } from '../models/wss.types';
import { EndpointsService } from './endpoints.service';

const PING_MESSAGE = 'ping';
const PONG_MESSAGE = 'pong';

@Injectable()
export abstract class AbstractWebsocketService<S extends ServerMessage, C extends ClientMessage> implements OnDestroy {
  isConnected$ = new BehaviorSubject<boolean>(false);
  unableToConnect$ = new Subject<void>();
  error$ = new Subject<number>();

  protected url = 'ws';

  private webSocket: WebSocketSubject<S | C | string> | null = null;
  private webSocketSubscription: Subscription | null = null;
  private opened$?: Subject<Event>;
  private closed$?: Subject<CloseEvent>;

  private token?: string;
  private closedCounter = 0;
  private isClosedCleanly = false;
  private pingTimeout?: number;
  private reconnectTimeout?: number;
  private config: WSSConfig = {
    max_pong_awaiting_time: null,
    ping_interval: null,
  };

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

    this.handleTabClosed();
    this.createWSSConnection();
  }

  public disconnect() {
    this.isClosedCleanly = true;
    this.clearTimeouts();
    this.closeConnection();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  protected abstract get class(): { name: string };
  protected abstract messagesHandler(message: S | C): void;

  protected openHandler() {
    Logger.log(this.class, 'WSS CONNECTED');
    this.isClosedCleanly = false;
    this.isConnected$.next(true);
    this.clearTimeouts();
  }

  protected closeHandler(event: CloseEvent) {
    this.isConnected$.next(false);
    this.clearPingTimeout();

    if (event.code !== 1000) {
      this.error$.next(event.code);
    }

    switch (event.code) {
      case 1000:
        Logger.log(this.class, 'WSS CLOSED CORRECTLY');
        this.isClosedCleanly = true;
        break;
      case 1006:
        Logger.error(this.class, 'WSS CLOSED due to internal connection error - UNABLE TO CONNECT', event);
        this.handleUnableToConnect();
        break;
      default:
        Logger.error(this.class, 'WSS CLOSED INCORRECTLY', event);
        this.tryToReconnect();
        break;
    }
  }

  protected createWSSConnection(): void {
    Logger.log(this.class, 'OPENING NEW WSS CONNECTION');

    this.webSocket = this.createWebsocketClient();

    this.webSocketSubscription = this.webSocket.subscribe({
      next: this.nextHandler.bind(this),
      error: this.errorHandler.bind(this),
    });
  }

  private createWebsocketClient(): WebSocketSubject<S | C | string> {
    this.setupObservers();

    return webSocket({
      url: this.es.getWebSocketEndpoint(this.url),
      protocol: this.token ? [this.token] : undefined,
      deserializer: this.deserializer.bind(this),
      serializer: this.serializer.bind(this),
      openObserver: this.opened$,
      closeObserver: this.closed$,
    });
  }

  private setupObservers() {
    this.opened$?.complete();
    this.closed$?.complete();

    this.opened$ = new Subject();
    this.closed$ = new Subject();

    this.opened$.subscribe(this.openHandler.bind(this));
    this.closed$.subscribe(this.closeHandler.bind(this));
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

  private errorHandler(err: ErrorEvent): void {
    Logger.error(this.class, `WSS ERROR occurred`, err);
  }

  private nextHandler(message: S | C | string): void {
    this.closedCounter = 0; // reset closed counter as message successfully came

    if (!message) {
      return;
    }

    if (typeof message === 'string' && message === PING_MESSAGE) {
      this.handlePingMessage();
      return;
    }

    if (typeof message === 'object' && message.hasOwnProperty('config')) {
      this.config = (message as WSSConfigServerMessage).config;
      return;
    }

    this.messagesHandler(message as S | C);
  }

  private handlePingMessage(): void {
    this.clearTimeouts();
    this.closedCounter = 0;
    this.sendWSSMessage(PONG_MESSAGE);

    if (this.config.ping_interval) {
      this.pingTimeout = setTimeout(() => {
        Logger.warn(this.class, `WSS PING timeout occurred - disconnecting`);

        this.webSocket?.error({ code: 3005, wasClean: false, reason: 'Disconnected due to lack of ping' });
        this.isConnected$.next(false);
      }, this.config.ping_interval * 1.5);
    }
  }

  private clearPingTimeout() {
    if (this.pingTimeout !== undefined) {
      clearTimeout(this.pingTimeout);
      this.pingTimeout = undefined;
    }
  }

  private clearTimeouts() {
    this.clearPingTimeout();

    if (this.reconnectTimeout !== undefined) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
  }

  private closeConnection(): void {
    this.webSocket?.unsubscribe();
    this.webSocket?.complete();
    this.webSocket = null;

    this.webSocketSubscription?.unsubscribe();
    this.webSocketSubscription = null;
  }

  private tryToReconnect(): void {
    if (!this.isClosedCleanly) {
      this.reconnectTimeout = setTimeout(() => {
        if (!this.isClosedCleanly) {
          Logger.warn(this.class, `WSS Trying to reconnect try no. ${++this.closedCounter}`);

          this.closeConnection();
          this.createWSSConnection();
        }
      }, 2000);
    }
  }

  private handleUnableToConnect() {
    this.unableToConnect$.next();
    this.disconnect();
  }

  private handleTabClosed() {
    window.onunload = () => {
      this.disconnect();
    };
  }
}
