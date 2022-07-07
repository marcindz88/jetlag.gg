import { NgModule } from '@angular/core';
import { NicknamePipe } from '@pg/game/game-shared/pipes/nickname.pipe';

const EXPORTED_DECLARATIONS = [NicknamePipe];

@NgModule({
  declarations: [EXPORTED_DECLARATIONS],
  exports: [EXPORTED_DECLARATIONS],
})
export class GameSharedModule {}
