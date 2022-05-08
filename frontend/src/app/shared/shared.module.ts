import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { CardComponent } from './components/card/card.component';

@NgModule({
  imports: [CommonModule, HttpClientModule],
  declarations: [CardComponent],
  exports: [CardComponent],
})
export class SharedModule {}
