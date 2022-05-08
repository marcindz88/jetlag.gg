import { Component } from '@angular/core';
import { Color } from 'three';
import { TextureModelsService } from '../../utils/services/texture-models.service';
import { EARTH_RADIUS } from '../../utils/models/game.constants';

@Component({
  selector: 'pg-earth',
  templateUrl: './earth.component.html',
})
export class EarthComponent {
  readonly EARTH_RADIUS = EARTH_RADIUS;

  textures$ = this.textureModelsService.earthTextures$;
  sheenColor = new Color('#ff8a00').convertSRGBToLinear();

  constructor(private textureModelsService: TextureModelsService) {}
}
