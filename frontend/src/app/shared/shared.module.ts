import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { NgtRepeatModule } from '@angular-three/core';
import { CardComponent } from '@shared/components/card/card.component';
import { LoaderComponent } from '@shared/components/loader/loader.component';

@NgModule({
  imports: [CommonModule, HttpClientModule, NgtRepeatModule],
  declarations: [CardComponent, LoaderComponent],
  exports: [CardComponent, LoaderComponent],
})
export class SharedModule {}
