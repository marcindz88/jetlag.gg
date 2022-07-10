import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { LastGamesComponent } from '@pg/game/game-intro/components/last-games/last-games.component';
import { GameIntroComponent } from '@pg/game/game-intro/containers/game-intro/game-intro.component';
import { GameIntroRoutingModule } from '@pg/game/game-intro/game-intro-routing.module';
import { GameIntroHttpService } from '@pg/game/game-intro/services/game-intro-http.service';
import { SharedModule } from '@shared/shared.module';

import { GameSharedModule } from '../game-shared/game-shared.module';
import { ConfirmLogoutDialogComponent } from './components/confirm-logout-dialog/confirm-logout-dialog/confirm-logout-dialog.component';

@NgModule({
  declarations: [GameIntroComponent, LastGamesComponent, ConfirmLogoutDialogComponent],
  imports: [CommonModule, SharedModule, GameIntroRoutingModule, GameSharedModule, MatDialogModule],
  providers: [GameIntroHttpService],
})
export class GameIntroModule {}
