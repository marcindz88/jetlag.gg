import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NgtCanvasModule, NgtObjectPassThroughModule, NgtRadianPipeModule } from '@angular-three/core';
import { NgtPerspectiveCameraModule } from '@angular-three/core/cameras';
import { NgtSphereGeometryModule } from '@angular-three/core/geometries';
import { NgtGroupModule } from '@angular-three/core/group';
import { NgtAmbientLightModule, NgtDirectionalLightModule } from '@angular-three/core/lights';
import { NgtMeshPhysicalMaterialModule } from '@angular-three/core/materials';
import { NgtMeshModule } from '@angular-three/core/meshes';
import { NgtSobaOrbitControlsModule } from '@angular-three/soba/controls';
import { PlayersService } from '@pg/players/services/players.service';
import { SharedModule } from '@shared/shared.module';

import { PlayersModule } from '../players/players.module';
import { EarthComponent } from './components/earth/earth.component';
import { PlaneComponent } from './components/plane/plane.component';
import { GameLoaderComponent } from './containers/game-loader/game-loader.component';
import { GameMainComponent } from './containers/game-main/game-main.component';
import { GameBaseRoutingModule } from './game-base-routing.module';
import { KeyboardControlsService } from './services/keyboard-controls.service';

@NgModule({
  declarations: [GameMainComponent, EarthComponent, PlaneComponent, GameLoaderComponent],
  imports: [
    CommonModule,
    GameBaseRoutingModule,
    NgtCanvasModule,
    NgtMeshModule,
    NgtSphereGeometryModule,
    NgtMeshPhysicalMaterialModule,
    NgtAmbientLightModule,
    NgtDirectionalLightModule,
    NgtSobaOrbitControlsModule,
    NgtGroupModule,
    NgtObjectPassThroughModule,
    NgtRadianPipeModule,
    SharedModule,
    PlayersModule,
    NgtPerspectiveCameraModule,
  ],
  providers: [PlayersService, KeyboardControlsService],
})
export class GameBaseModule {}
