import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { NgtRepeatModule } from '@angular-three/core';
import { CompassComponent } from '@pg/players/components/compass/compass.component';
import { PlayerCockpitComponent } from '@pg/players/components/player-cockpit/player-cockpit.component';
import { SharedModule } from '@shared/shared.module';

import { PlayerSummaryComponent } from './components/player-summary/player-summary.component';
import { PlayersSummaryComponent } from './components/players-summary/players-summary.component';

@NgModule({
  imports: [CommonModule, HttpClientModule, SharedModule, NgtRepeatModule],
  declarations: [PlayersSummaryComponent, PlayerSummaryComponent, PlayerCockpitComponent, CompassComponent],
  exports: [PlayersSummaryComponent, PlayerCockpitComponent],
})
export class PlayersModule {}
