import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameBaseRoutingModule } from './game-base-routing.module';
import { GameMainComponent } from './containers/game-main/game-main.component';
import { NgtCanvasModule, NgtObjectPassThroughModule, NgtRadianPipeModule } from '@angular-three/core';
import { EarthComponent } from './containers/earth/earth.component';
import { NgtMeshModule } from '@angular-three/core/meshes';
import { NgtSphereGeometryModule } from '@angular-three/core/geometries';
import { NgtMeshPhysicalMaterialModule } from '@angular-three/core/materials';
import { NgtAmbientLightModule, NgtDirectionalLightModule } from '@angular-three/core/lights';
import { NgtSobaOrbitControlsModule } from '@angular-three/soba/controls';
import { PlaneComponent } from './components/plane/plane.component';
import { TextureModelsService } from './services/texture-models.service';
import { NgtGroupModule } from '@angular-three/core/group';

@NgModule({
  declarations: [
    GameMainComponent,
    EarthComponent,
    PlaneComponent
  ],
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
    NgtRadianPipeModule
  ],
  providers: [
    TextureModelsService
  ]
})
export class GameBaseModule {
}
