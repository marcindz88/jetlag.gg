import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { GameIntroComponent } from '@pg/game/game-intro/containers/game-intro/game-intro.component';
import { GameIntroRoutingModule } from '@pg/game/game-intro/game-intro-routing.module';
import { SharedModule } from '@shared/shared.module';

@NgModule({
  declarations: [GameIntroComponent],
  imports: [CommonModule, SharedModule, GameIntroRoutingModule],
})
export class GameIntroModule {}
