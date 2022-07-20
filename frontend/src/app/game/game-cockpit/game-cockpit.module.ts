import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgtRepeatModule } from '@angular-three/core';
import { CompassComponent } from '@pg/game/game-cockpit/components/compass/compass.component';
import { HelpComponent } from '@pg/game/game-cockpit/components/help/help.component';
import { NearbyAirportsComponent } from '@pg/game/game-cockpit/components/nearby-airports/nearby-airports.component';
import { PlayerStatsComponent } from '@pg/game/game-cockpit/components/player-stats/player-stats.component';
import { ShipmentDetailsComponent } from '@pg/game/game-cockpit/components/shipment-details/shipment-details.component';
import { GameAirportPanelComponent } from '@pg/game/game-cockpit/containers/game-airport-panel/game-airport-panel.component';
import { GameCockpitComponent } from '@pg/game/game-cockpit/containers/game-cockpit/game-cockpit.component';
import { GameCockpitRoutingModule } from '@pg/game/game-cockpit/game-cockpit-routing.module';
import { SharedModule } from '@shared/shared.module';

import { GameSharedModule } from '../game-shared/game-shared.module';
import { PlayersSummaryComponent } from './components/players-summary/players-summary.component';
import { GameCockpitHttpService } from './services/game-cockpit-http.service';

@NgModule({
  declarations: [
    PlayersSummaryComponent,
    GameCockpitComponent,
    PlayerStatsComponent,
    CompassComponent,
    HelpComponent,
    NearbyAirportsComponent,
    ShipmentDetailsComponent,
    GameAirportPanelComponent,
  ],
  imports: [CommonModule, SharedModule, GameCockpitRoutingModule, NgtRepeatModule, MatTooltipModule, GameSharedModule],
  providers: [GameCockpitHttpService],
})
export class GameCockpitModule {}
