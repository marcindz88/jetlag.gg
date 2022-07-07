import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NgtCanvasModule, NgtPiPipeModule, NgtRadianPipeModule } from '@angular-three/core';
import { NgtCircleGeometryModule, NgtSphereGeometryModule } from '@angular-three/core/geometries';
import { NgtGroupModule } from '@angular-three/core/group';
import { NgtAmbientLightModule, NgtDirectionalLightModule } from '@angular-three/core/lights';
import { NgtMeshBasicMaterialModule, NgtMeshPhysicalMaterialModule } from '@angular-three/core/materials';
import { NgtMeshModule } from '@angular-three/core/meshes';
import { NgtPrimitiveModule } from '@angular-three/core/primitive';
import { NgtSobaOrbitControlsModule } from '@angular-three/soba/controls';
import { NgtSobaStarsModule } from '@angular-three/soba/staging';
import { AirportComponent } from '@pg/game/game-3d/components/airport/airport.component';
import { EarthComponent } from '@pg/game/game-3d/components/earth/earth.component';
import { PlaneComponent } from '@pg/game/game-3d/components/plane/plane.component';
import { GameSceneComponent } from '@pg/game/game-3d/containers/game-scene/game-scene.component';
import { GameSharedModule } from '@pg/game/game-shared/game-shared.module';
import { SharedModule } from '@shared/shared.module';

const EXPORTED_DECLARATIONS = [PlaneComponent, AirportComponent, EarthComponent, GameSceneComponent];

@NgModule({
  declarations: [EXPORTED_DECLARATIONS],
  imports: [
    CommonModule,
    NgtCanvasModule,
    NgtMeshModule,
    NgtSphereGeometryModule,
    NgtMeshPhysicalMaterialModule,
    NgtAmbientLightModule,
    NgtDirectionalLightModule,
    NgtSobaOrbitControlsModule,
    NgtGroupModule,
    NgtRadianPipeModule,
    NgtSobaStarsModule,
    NgtPrimitiveModule,
    SharedModule,
    NgtPiPipeModule,
    NgtMeshBasicMaterialModule,
    NgtCircleGeometryModule,
    GameSharedModule,
  ],
  exports: [EXPORTED_DECLARATIONS],
})
export class Game3dModule {}
