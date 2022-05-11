import { Injectable } from '@angular/core';
import { ClientMessageTypeEnum, ServerMessageTypeEnum } from '../models/wss.types';
import { distinctUntilChanged, filter, map, Observable, of, switchMap, take, tap, timer } from 'rxjs';
import { WebsocketService } from './websocket.service';

@Injectable({
  providedIn: 'root',
})
export class ClockService {
  private timeDelta = 0;
  private timeSyncer$: Observable<void> = this.createTimeSyncer();
  constructor(private webSocketService: WebsocketService) {}

  getCurrentTime() {
    return this.getTime() - this.timeDelta;
  }

  setupSyncingOfTime() {
    this.webSocketService.isConnected$
      .pipe(
        distinctUntilChanged(),
        switchMap(isConnected => (isConnected ? this.timeSyncer$ : of(null)))
      )
      .subscribe();
  }

  private createTimeSyncer() {
    return timer(0, 10000).pipe(
      map(() => this.getTime()),
      tap(() =>
        this.webSocketService.sendWSSMessage({
          type: ClientMessageTypeEnum.CLOCK_SYNC,
          created: this.getTime(),
          data: {},
        })
      ),
      switchMap(sentTime =>
        this.webSocketService.clockMessages$.pipe(
          filter(message => message.type === ServerMessageTypeEnum.CLOCK_TIME),
          take(1),
          tap(
            timeMessage =>
              // Server time - half of the request time - sent time
              (this.timeDelta = timeMessage.data.timestamp - (this.getTime() - sentTime) / 2 - sentTime)
          )
        )
      ),
      map(() => undefined)
    );
  }

  private getTime() {
    return new Date().getTime();
  }
}
