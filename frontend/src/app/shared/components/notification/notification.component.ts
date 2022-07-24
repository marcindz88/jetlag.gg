import { Component, Inject } from '@angular/core';
import { QUEUE_BAR_DATA } from 'ngx-mat-queue-bar';

export type NotificationData = { text: string; icon?: string; style?: 'warn' | 'error'; clickAction?: () => void };

@Component({
  selector: 'pg-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
})
export class NotificationComponent {
  constructor(@Inject(QUEUE_BAR_DATA) public data: NotificationData) {}

  handleClicked(event: Event) {
    if (this.data.clickAction) {
      this.data.clickAction();
      event.stopPropagation();
    }
  }
}
