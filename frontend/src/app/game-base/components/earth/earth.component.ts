import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EARTH_RADIUS } from '@pg/game-base/models/game.constants';
import { TextureModelsService } from '@pg/game-base/services/texture-models.service';
import { Color } from 'three';

@Component({
  selector: 'pg-earth',
  templateUrl: './earth.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EarthComponent {
  readonly EARTH_RADIUS = EARTH_RADIUS;

  textures$ = this.textureModelsService.earthTextures$;
  sheenColor = new Color('#ff8a00').convertSRGBToLinear();

  constructor(private textureModelsService: TextureModelsService) {}
}
