import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NgtCanvasModule, NgtObjectPassThroughModule, NgtRadianPipeModule } from '@angular-three/core';
import { NgtOrthographicCameraModule, NgtPerspectiveCameraModule } from '@angular-three/core/cameras';
import { NgtSphereGeometryModule } from '@angular-three/core/geometries';
import { NgtGroupModule } from '@angular-three/core/group';
import { NgtAmbientLightModule, NgtDirectionalLightModule } from '@angular-three/core/lights';
import { NgtMeshPhysicalMaterialModule } from '@angular-three/core/materials';
import { NgtMeshModule } from '@angular-three/core/meshes';
import { NgtSobaOrthographicCameraModule } from '@angular-three/soba/cameras';
import { NgtSobaOrbitControlsModule } from '@angular-three/soba/controls';
import { NgtSobaStarsModule } from '@angular-three/soba/staging';
import { AirportsModule } from '@pg/game-base/airports/airports.module';
import { EarthComponent } from '@pg/game-base/components/earth/earth.component';
import { GameSceneComponent } from '@pg/game-base/containers/game-scene/game-scene.component';
import { SharedModule } from '@shared/shared.module';

import { GameMainComponent } from './containers/game-main/game-main.component';
import { GameBaseRoutingModule } from './game-base-routing.module';
import { PlayersModule } from './players/players.module';
import { KeyboardControlsService } from './services/keyboard-controls.service';

@NgModule({
  declarations: [GameMainComponent, GameSceneComponent, EarthComponent],
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
    AirportsModule,
    NgtPerspectiveCameraModule,
    NgtSobaStarsModule,
    NgtSobaOrthographicCameraModule,
    NgtOrthographicCameraModule,
  ],
  providers: [KeyboardControlsService],
})
export class GameBaseModule {}
