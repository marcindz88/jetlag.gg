import { Injectable } from '@angular/core';
import { MatSnackBarConfig } from '@angular/material/snack-bar';
import { NotificationComponent, NotificationData } from '@shared/components/notification/notification.component';
import { QueueBarService } from 'ngx-mat-queue-bar';
import { QueueBarRef } from 'ngx-mat-queue-bar/lib/queue-bar-ref';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(private queueBarService: QueueBarService) {}

  openNotification(
    data: NotificationData,
    config: Partial<MatSnackBarConfig> = {}
  ): QueueBarRef<NotificationComponent> {
    return this.queueBarService.openFromComponent(NotificationComponent, {
      ...config,
      data,
    });
  }
}
