import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { GameOverComponent } from '@pg/game/game-over/containers/game-over/game-over.component';
import { GameOverRoutingModule } from '@pg/game/game-over/game-over-routing.module';
import { SharedModule } from '@shared/shared.module';

@NgModule({
  declarations: [GameOverComponent],
  imports: [CommonModule, SharedModule, GameOverRoutingModule],
})
export class GameOverModule {}
