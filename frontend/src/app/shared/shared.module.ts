import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { NgtRepeatModule } from '@angular-three/core';
import { CardComponent } from '@shared/components/card/card.component';
import { LoaderComponent } from '@shared/components/loader/loader.component';
import { TableComponent } from '@shared/components/table/table.component';

@NgModule({
  imports: [CommonModule, HttpClientModule, NgtRepeatModule],
  declarations: [CardComponent, TableComponent, LoaderComponent],
  exports: [CardComponent, TableComponent, LoaderComponent],
})
export class SharedModule {}
