import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IntroRoutingModule } from './intro-routing.module';
import { StartComponent } from './containers/start/start.component';
import { SharedModule } from '../shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [StartComponent],
  imports: [CommonModule, IntroRoutingModule, SharedModule, ReactiveFormsModule],
})
export class IntroModule {}
