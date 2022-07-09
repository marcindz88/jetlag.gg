import { NgModule } from '@angular/core';
import { ControlsInfoComponent } from '@pg/game/game-shared/components/controls-info/controls-info.component';
import { GameDescriptionComponent } from '@pg/game/game-shared/components/game-description/game-description.component';
import { DeathCausePipe } from '@pg/game/game-shared/pipes/death-cause.pipe';
import { NicknamePipe } from '@pg/game/game-shared/pipes/nickname.pipe';

const EXPORTED_DECLARATIONS = [NicknamePipe, DeathCausePipe, ControlsInfoComponent, GameDescriptionComponent];

@NgModule({
  declarations: [EXPORTED_DECLARATIONS],
  exports: [EXPORTED_DECLARATIONS],
})
export class GameSharedModule {}
