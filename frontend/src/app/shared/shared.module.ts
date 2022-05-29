import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { NgtRepeatModule } from '@angular-three/core';
import { NgtSobaText3dModule } from '@angular-three/soba/abstractions';
import { CardComponent } from '@shared/components/card/card.component';
import { ElevatedTextComponent } from '@shared/components/elevated-text/elevated-text.component';
import { LoaderComponent } from '@shared/components/loader/loader.component';
import { TableComponent } from '@shared/components/table/table.component';

import { RemainingTimePipe } from './pipes/remaining-time.pipe';

@NgModule({
  imports: [CommonModule, HttpClientModule, NgtRepeatModule, NgtSobaText3dModule],
  declarations: [CardComponent, TableComponent, LoaderComponent, ElevatedTextComponent, RemainingTimePipe],
  exports: [CardComponent, TableComponent, LoaderComponent, ElevatedTextComponent, RemainingTimePipe],
})
export class SharedModule {}
