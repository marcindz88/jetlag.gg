import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NgtRepeatModule } from '@angular-three/core';
import { NgtSobaText3dModule } from '@angular-three/soba/abstractions';
import { CardComponent } from '@shared/components/card/card.component';
import { ElevatedTextComponent } from '@shared/components/elevated-text/elevated-text.component';
import { FullScreenLoaderComponent } from '@shared/components/full-screen-loader/full-screen-loader.component';
import { LoaderComponent } from '@shared/components/loader/loader.component';
import { LoadingButtonComponent } from '@shared/components/loading-button/loading-button.component';
import { NotificationComponent } from '@shared/components/notification/notification.component';
import { TableComponent } from '@shared/components/table/table.component';
import { materialConfigProviders } from '@shared/constants/material-config';
import { QueueBarModule } from 'ngx-mat-queue-bar';

import { RemainingTimePipe } from './pipes/remaining-time.pipe';

const EXPORTED_DECLARATIONS = [
  CardComponent,
  TableComponent,
  FullScreenLoaderComponent,
  LoaderComponent,
  LoadingButtonComponent,
  ElevatedTextComponent,
  RemainingTimePipe,
  NotificationComponent,
];

@NgModule({
  imports: [CommonModule, NgtRepeatModule, NgtSobaText3dModule, QueueBarModule],
  declarations: [EXPORTED_DECLARATIONS],
  exports: [EXPORTED_DECLARATIONS, QueueBarModule],
  providers: [materialConfigProviders],
})
export class SharedModule {}
