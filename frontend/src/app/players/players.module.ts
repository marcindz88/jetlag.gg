import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { PlayerStatsComponent } from '@pg/players/components/player-stats/player-stats.component';
import { SharedModule } from '@shared/shared.module';

import { PlayerSummaryComponent } from './components/player-summary/player-summary.component';
import { PlayersSummaryComponent } from './components/players-summary/players-summary.component';

@NgModule({
  imports: [CommonModule, HttpClientModule, SharedModule],
  declarations: [PlayersSummaryComponent, PlayerSummaryComponent, PlayerStatsComponent],
  exports: [PlayersSummaryComponent, PlayerStatsComponent],
})
export class PlayersModule {}
