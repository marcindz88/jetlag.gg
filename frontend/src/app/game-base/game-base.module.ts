import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameBaseRoutingModule } from './game-base-routing.module';
import { GameMainComponent } from './containers/game-main/game-main.component';
import { NgtCanvasModule } from '@angular-three/core';
import { EarthComponent } from './containers/earth/earth.component';
import { NgtMeshModule } from '@angular-three/core/meshes';
import { NgtSphereGeometryModule } from '@angular-three/core/geometries';
import { NgtMeshPhysicalMaterialModule } from '@angular-three/core/materials';
import { NgtAmbientLightModule, NgtDirectionalLightModule } from '@angular-three/core/lights';
import { NgtSobaOrbitControlsModule } from '@angular-three/soba/controls';

@NgModule({
  declarations: [
    GameMainComponent,
    EarthComponent
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
    NgtSobaOrbitControlsModule
  ]
})
export class GameBaseModule {
}
