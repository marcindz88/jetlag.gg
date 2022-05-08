import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { EndpointsService } from './endpoints.service';
import { Message } from '../models/wss.types';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  playerMessages$: Subject<Message> = new Subject();

  private webSocket: WebSocketSubject<Message> | null = null;
  private closedCounter = 0;

  constructor(private es: EndpointsService) {}

  createWSSConnection(token: string): void {
    console.log('OPENING NEW WSS CONNECTION');
    this.webSocket = webSocket<Message>({
      url: this.es.getWebSocketEndpoint(),
      protocol: [token],
    });
    this.webSocket.subscribe({
      next: (message: Message) => {
        if (message.type.startsWith('player')) {
          this.playerMessages$.next(message);
        }
      },
      error: err => {
        console.error('WSS ERROR', err);
        this.tryToReconnect(token);
      },
      complete: () => {
        console.warn('WSS CONNECTION CLOSED');
        this.tryToReconnect(token);
      },
    });
  }

  sendWSSMessage(message: Message): void {
    if (this.webSocket) {
      this.webSocket.next(message);
    } else {
      console.error('No WSS connection available');
    }
  }

  closeWSSConnection(): void {
    this.closeConnection();
  }

  private closeConnection(): void {
    if (this.webSocket) {
      this.webSocket.unsubscribe();
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
