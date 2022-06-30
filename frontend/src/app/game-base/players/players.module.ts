import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { NgtPiPipeModule, NgtRepeatModule } from '@angular-three/core';
import { NgtGroupModule } from '@angular-three/core/group';
import { NgtDirectionalLightModule } from '@angular-three/core/lights';
import { NgtPrimitiveModule } from '@angular-three/core/primitive';
import { AirportsModule } from '@pg/game-base/airports/airports.module';
import { CompassComponent } from '@pg/game-base/players/components/compass/compass.component';
import { GameOverComponent } from '@pg/game-base/players/components/game-over/game-over.component';
import { HelpComponent } from '@pg/game-base/players/components/help/help.component';
import { PlaneComponent } from '@pg/game-base/players/components/plane/plane.component';
import { PlayerCockpitComponent } from '@pg/game-base/players/components/player-cockpit/player-cockpit.component';
import { PlayerCockpitStatsComponent } from '@pg/game-base/players/components/player-cockpit-stats/player-cockpit-stats.component';
import { SharedModule } from '@shared/shared.module';

import { PlayersSummaryComponent } from './components/players-summary/players-summary.component';

@NgModule({
  declarations: [
    PlaneComponent,
    PlayersSummaryComponent,
    PlayerCockpitComponent,
    PlayerCockpitStatsComponent,
    CompassComponent,
    HelpComponent,
    GameOverComponent,
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    SharedModule,
    NgtRepeatModule,
    NgtPrimitiveModule,
    AirportsModule,
    NgtGroupModule,
    NgtPiPipeModule,
    NgtDirectionalLightModule,
  ],
  exports: [PlayersSummaryComponent, PlayerCockpitComponent, PlaneComponent],
})
export class PlayersModule {}
