import { Provider } from '@angular/core';
import { MAT_DIALOG_DEFAULT_OPTIONS, MatDialogConfig } from '@angular/material/dialog';
import { MatSnackBarConfig } from '@angular/material/snack-bar';
import { MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltipDefaultOptions } from '@angular/material/tooltip';
import { QUEUE_BAR_CONFIG, QUEUE_BAR_DEFAULT_OPTIONS, QueueBarConfig } from 'ngx-mat-queue-bar';

export const notificationSnackbarConfig: MatSnackBarConfig = {
  duration: 6000,
  horizontalPosition: 'center',
  verticalPosition: 'top',
  panelClass: 'notification-snack-bar-container',
};

const tooltipConfig: MatTooltipDefaultOptions = {
  position: 'above',
  touchendHideDelay: 100,
  showDelay: 100,
  hideDelay: 5000,
};

const dialogConfig: MatDialogConfig = {
  panelClass: 'pg-dialog-container',
};

const queueBarConfig: QueueBarConfig = { maxOpenedSnackbars: 4 };

export const materialConfigProviders: Provider[] = [
  {
    provide: QUEUE_BAR_CONFIG,
    useValue: queueBarConfig,
  },
  {
    provide: MAT_TOOLTIP_DEFAULT_OPTIONS,
    useValue: tooltipConfig,
  },
  {
    provide: MAT_DIALOG_DEFAULT_OPTIONS,
    useValue: dialogConfig,
  },
  {
    provide: QUEUE_BAR_DEFAULT_OPTIONS,
    useValue: notificationSnackbarConfig,
  },
];
