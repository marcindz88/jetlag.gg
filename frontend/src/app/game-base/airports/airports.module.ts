import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { NgtPiPipeModule } from '@angular-three/core';
import { NgtCircleGeometryModule } from '@angular-three/core/geometries';
import { NgtGroupModule } from '@angular-three/core/group';
import { NgtAxesHelperModule } from '@angular-three/core/helpers';
import { NgtMeshBasicMaterialModule } from '@angular-three/core/materials';
import { NgtMeshModule } from '@angular-three/core/meshes';
import { NgtPrimitiveModule } from '@angular-three/core/primitive';
import { NgtSobaText3dModule } from '@angular-three/soba/abstractions';
import { AirportComponent } from '@pg/game-base/airports/components/airport/airport.component';
import { NearbyAirportsComponent } from '@pg/game-base/airports/components/nearby-airports/nearby-airports.component';
import { ShipmentDetailsComponent } from '@pg/game-base/airports/components/shipment-details/shipment-details.component';
import { AirportMainPanelComponent } from '@pg/game-base/airports/containers/airport-main-panel/airport-main-panel.component';
import { SharedModule } from '@shared/shared.module';

@NgModule({
  declarations: [AirportComponent, NearbyAirportsComponent, ShipmentDetailsComponent, AirportMainPanelComponent],
  imports: [
    CommonModule,
    HttpClientModule,
    NgtPrimitiveModule,
    NgtGroupModule,
    NgtSobaText3dModule,
    NgtPiPipeModule,
    NgtAxesHelperModule,
    SharedModule,
    NgtMeshBasicMaterialModule,
    NgtMeshModule,
    NgtCircleGeometryModule,
  ],
  exports: [AirportComponent, NearbyAirportsComponent, AirportMainPanelComponent],
})
export class AirportsModule {}
