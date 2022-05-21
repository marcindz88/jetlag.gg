import { Injectable } from '@angular/core';
import { AbstractWebsocketService } from '@shared/services/abstract-websocket.service';
import { Logger } from '@shared/services/logger.service';
import { merge, Observable, Subscription, takeWhile, timer } from 'rxjs';

import { ClockClientMessage, ClockServerMessage } from '../models/wss.types';

@Injectable({
  providedIn: 'root',
})
export class ClockService extends AbstractWebsocketService<ClockServerMessage, ClockClientMessage> {
  protected override url = 'clock';
  private timeDelta: number | null = null;
  private timeSyncer$: Observable<number> = this.createTimeSyncer();
  private timeSyncerSubscription: Subscription | null = null;

  get class(): { name: string } {
    return ClockService;
  }

  setupSyncingOfTime() {
    this.createWSSConnection();
  }

  getCurrentTime() {
    return this.getTime() + this.delta;
  }

  protected messagesHandler(message: ClockServerMessage): void {
    this.updateDelta(message.t, message.ref);
  }

  protected override openHandler() {
    super.openHandler();
    this.timeSyncerSubscription = this.timeSyncer$.subscribe(() => this.sendWSSMessage(this.getTime()));
  }

  protected override closeHandler() {
    super.closeHandler();
    this.timeSyncerSubscription?.unsubscribe();
  }

  private get delta(): number {
    return this.timeDelta || 0;
  }

  private createTimeSyncer() {
    // 20 quick samples then update every 10 seconds
    return merge(timer(0, 500).pipe(takeWhile(i => i < 20)), timer(5000, 5000));
  }

  private updateDelta(messageTimestamp: number, sentTime: number) {
    // Server time - half of the request time - sent time
    const delta = messageTimestamp - (this.getTime() - sentTime) / 2 - sentTime;
    if (this.timeDelta !== null) {
      // If delta is significantly larger than current saved - reject
      if (Math.abs(delta) > (Math.abs(this.delta) + 1) * 20) {
        Logger.warn(ClockService, `RECEIVED: ${delta.toFixed(0)} -> REJECTED`);
        return;
      }
      this.timeDelta = Math.round((this.delta + delta) / 2);
    } else {
      this.timeDelta = Math.round(delta);
    }

    Logger.log(ClockService, `RECEIVED: ${delta.toFixed(0)} -> NEW DELTA: ${this.timeDelta}`);
  }

  private getTime() {
    return new Date().getTime();
  }
}
