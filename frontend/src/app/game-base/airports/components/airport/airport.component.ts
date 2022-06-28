import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Airport } from '@pg/game-base/airports/models/airport';
import { CONFIG } from '@shared/services/config.service';
import { map } from 'rxjs';

import { TextureModelsService } from '../../../services/texture-models.service';

@UntilDestroy()
@Component({
  selector: 'pg-airport',
  templateUrl: './airport.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AirportComponent implements OnInit {
  @Input() airport!: Airport;

  readonly NEARBY_AIRPORT_SCALED_DISTANCE = CONFIG.AIRPORT_MAXIMUM_DISTANCE_TO_LAND_SCALED;
  readonly materials = this.textureModelsService.materials;
  readonly textures$ = this.textureModelsService.airportTextures$.pipe(
    map(({ model, ...colors }) => ({ model: model.clone(true), ...colors }))
  );

  constructor(private textureModelsService: TextureModelsService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.setOccupiedUpdater();
  }

  private setOccupiedUpdater() {
    this.airport.occupiedChange$.pipe(untilDestroyed(this)).subscribe(() => this.cdr.markForCheck());
  }
}
