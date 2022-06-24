import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NgtRepeatModule } from '@angular-three/core';
import { NgtSobaText3dModule } from '@angular-three/soba/abstractions';
import { CardComponent } from '@shared/components/card/card.component';
import { ElevatedTextComponent } from '@shared/components/elevated-text/elevated-text.component';
import { LoaderComponent } from '@shared/components/loader/loader.component';
import { LoadingButtonComponent } from '@shared/components/loading-button/loading-button.component';
import { NotificationComponent } from '@shared/components/notification/notification.component';
import { notificationSnackbarConfigProvider } from '@shared/components/notification/notification-snackbar.config';
import { TableComponent } from '@shared/components/table/table.component';

import { RemainingTimePipe } from './pipes/remaining-time.pipe';

const EXPORTED_DECLARATIONS = [
  CardComponent,
  TableComponent,
  LoaderComponent,
  LoadingButtonComponent,
  ElevatedTextComponent,
  RemainingTimePipe,
  NotificationComponent,
];

@NgModule({
  imports: [CommonModule, HttpClientModule, NgtRepeatModule, NgtSobaText3dModule, MatSnackBarModule],
  declarations: [EXPORTED_DECLARATIONS],
  exports: [EXPORTED_DECLARATIONS, MatSnackBarModule],
  providers: [notificationSnackbarConfigProvider],
})
export class SharedModule {}
