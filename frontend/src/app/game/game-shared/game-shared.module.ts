import { NgModule } from '@angular/core';
import { DeathCausePipe } from '@pg/game/game-shared/pipes/death-cause.pipe';
import { NicknamePipe } from '@pg/game/game-shared/pipes/nickname.pipe';

const EXPORTED_DECLARATIONS = [NicknamePipe, DeathCausePipe];

@NgModule({
  declarations: [EXPORTED_DECLARATIONS],
  exports: [EXPORTED_DECLARATIONS],
})
export class GameSharedModule {}
