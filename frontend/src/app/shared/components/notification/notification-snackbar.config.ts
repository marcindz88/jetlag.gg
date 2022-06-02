import { Provider } from '@angular/core';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS, MatSnackBarConfig } from '@angular/material/snack-bar';

export const notificationSnackbarConfig: MatSnackBarConfig = {
  duration: 10000,
  horizontalPosition: 'center',
  verticalPosition: 'top',
  panelClass: 'notification-snack-bar-container',
};

export const notificationSnackbarConfigProvider: Provider = {
  provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
  useValue: notificationSnackbarConfig,
};
