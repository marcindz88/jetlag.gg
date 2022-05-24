import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { NgtPiPipeModule } from '@angular-three/core';
import { NgtGroupModule } from '@angular-three/core/group';
import { NgtAxesHelperModule } from '@angular-three/core/helpers';
import { NgtPrimitiveModule } from '@angular-three/core/primitive';
import { NgtSobaText3dModule } from '@angular-three/soba/abstractions';
import { AirportComponent } from '@pg/game-base/airports/components/airport/airport.component';
import { AirportInfoComponent } from '@pg/game-base/airports/components/airport-info/airport-info.component';
import { NearbyAirportsComponent } from '@pg/game-base/airports/components/nearby-airports/nearby-airports.component';
import { SharedModule } from '@shared/shared.module';

@NgModule({
  declarations: [AirportComponent, NearbyAirportsComponent, AirportInfoComponent],
  imports: [
    CommonModule,
    HttpClientModule,
    NgtPrimitiveModule,
    NgtGroupModule,
    NgtSobaText3dModule,
    NgtPiPipeModule,
    NgtAxesHelperModule,
    SharedModule,
  ],
  exports: [AirportComponent, NearbyAirportsComponent],
})
export class AirportsModule {}
