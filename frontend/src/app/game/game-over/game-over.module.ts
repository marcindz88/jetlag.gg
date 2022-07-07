import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { LeaderboardComponent } from '@pg/game/game-over/components/leaderboard/leaderboard.component';
import { GameOverComponent } from '@pg/game/game-over/containers/game-over/game-over.component';
import { GameOverRoutingModule } from '@pg/game/game-over/game-over-routing.module';
import { GameOverHttpService } from '@pg/game/game-over/services/game-over-http.service';
import { SharedModule } from '@shared/shared.module';

import { GameSharedModule } from '../game-shared/game-shared.module';

@NgModule({
  declarations: [GameOverComponent, LeaderboardComponent],
  imports: [CommonModule, SharedModule, GameOverRoutingModule, GameSharedModule],
  providers: [GameOverHttpService],
})
export class GameOverModule {}
