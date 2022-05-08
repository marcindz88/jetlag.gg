import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { PlayersSummaryComponent } from './components/players-summary/players-summary.component';
import { SharedModule } from '../shared/shared.module';
import { PlayerSummaryComponent } from './components/player-summary/player-summary.component';

@NgModule({
  imports: [CommonModule, HttpClientModule, SharedModule],
  declarations: [PlayersSummaryComponent, PlayerSummaryComponent],
  exports: [PlayersSummaryComponent],
})
export class PlayersModule {}