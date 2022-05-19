import { Injectable } from '@angular/core';
import { Logger } from '@shared/services/logger.service';
import { distinctUntilChanged, filter, map, merge, Observable, of, switchMap, take, takeWhile, tap, timer } from 'rxjs';

import { ClientMessageTypeEnum, ServerMessageTypeEnum } from '../models/wss.types';
import { WebsocketService } from './websocket.service';

@Injectable({
  providedIn: 'root',
})
export class ClockService {
  private timeDelta = 0;
  private timeSyncer$: Observable<void> = this.createTimeSyncer();
  constructor(private webSocketService: WebsocketService) {}

  getCurrentTime() {
    return this.getTime() + this.timeDelta;
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
    // 20 quick samples then update every 10 seconds
    return merge(timer(0, 500).pipe(takeWhile(i => i < 20)), timer(10000, 5000)).pipe(
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
          tap(timeMessage => this.updateDelta(timeMessage.data.timestamp, sentTime))
        )
      ),
      map(() => undefined)
    );
  }

  private updateDelta(messageTimestamp: number, sentTime: number) {
    // Server time - half of the request time - sent time
    const delta = messageTimestamp - (this.getTime() - sentTime) / 2 - sentTime;
    if (this.timeDelta) {
      this.timeDelta = Math.round((this.timeDelta + delta) / 2);
    } else {
      this.timeDelta = delta;
    }
    Logger.log(ClockService, `OLD DELTA: ${this.timeDelta} - NEW: ${delta}`);
  }

  private getTime() {
    return new Date().getTime();
  }
}
