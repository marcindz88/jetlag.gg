import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarRef } from '@angular/material/snack-bar';
import { NotificationComponent, NotificationData } from '@shared/components/notification/notification.component';

export const notificationSnackbarConfig: MatSnackBarConfig = {
  duration: 10000,
  horizontalPosition: 'center',
  verticalPosition: 'top',
  panelClass: 'notification-snack-bar-container',
};

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(private matSnackbar: MatSnackBar) {}

  openNotification(
    data: NotificationData,
    config: Partial<MatSnackBarConfig> = {}
  ): MatSnackBarRef<NotificationComponent> {
    return this.matSnackbar.openFromComponent(NotificationComponent, {
      ...notificationSnackbarConfig,
      ...config,
      data,
    });
  }
}
