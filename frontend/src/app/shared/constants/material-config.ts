import { Provider } from '@angular/core';
import { MatSnackBarConfig } from '@angular/material/snack-bar';
import { MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltipDefaultOptions } from '@angular/material/tooltip';
import { QUEUE_BAR_DEFAULT_OPTIONS } from 'ngx-mat-queue-bar';

export const notificationSnackbarConfig: MatSnackBarConfig = {
  duration: 10000,
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

export const materialConfigProviders: Provider[] = [
  {
    provide: MAT_TOOLTIP_DEFAULT_OPTIONS,
    useValue: tooltipConfig,
  },
  {
    provide: QUEUE_BAR_DEFAULT_OPTIONS,
    useValue: notificationSnackbarConfig,
  },
];
