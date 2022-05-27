import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Airport } from '@pg/game-base/airports/models/airport';
import { NEARBY_AIRPORT_SCALED_DISTANCE } from '@pg/game-base/constants/game.constants';
import { map } from 'rxjs';

import { TextureModelsService } from '../../../services/texture-models.service';

@Component({
  selector: 'pg-airport',
  templateUrl: './airport.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AirportComponent {
  @Input() airport!: Airport;
  @Input() cameraFollowing = false;

  readonly NEARBY_AIRPORT_SCALED_DISTANCE = NEARBY_AIRPORT_SCALED_DISTANCE;
  readonly materials = this.textureModelsService.materials;
  readonly textures$ = this.textureModelsService.airportTextures$.pipe(
    map(({ model, ...colors }) => ({ model: model.clone(true), ...colors }))
  );

  constructor(private textureModelsService: TextureModelsService) {}
}
