import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NgtCanvasModule } from '@angular-three/core';
import { Game3dModule } from '@pg/game/game-3d/game-3d.module';
import { AirportsService } from '@pg/game/services/airports.service';
import { GameWebsocketService } from '@pg/game/services/game-websocket.service';
import { MainGameService } from '@pg/game/services/main-game.service';
import { PlayersService } from '@pg/game/services/players.service';
import { SharedModule } from '@shared/shared.module';

import { GameComponent } from './game.component';
import { GameRoutingModule } from './game-routing.module';
import { KeyboardAndTouchControlsService } from './services/keyboard-and-touch-controls.service';

@NgModule({
  declarations: [GameComponent],
  imports: [CommonModule, GameRoutingModule, SharedModule, Game3dModule, NgtCanvasModule],
  providers: [KeyboardAndTouchControlsService, MainGameService, GameWebsocketService, PlayersService, AirportsService],
})
export class GameModule {}
