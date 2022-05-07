import { Component } from '@angular/core';
import { Color } from 'three';
import { TextureModelsService } from '../../services/texture-models.service';

@Component({
  selector: 'pg-earth',
  templateUrl: './earth.component.html',
  styleUrls: ['./earth.component.scss']
})
export class EarthComponent {
  textures$ = this.textureModelsService.earthTextures$;
  sheenColor = new Color('#ff8a00').convertSRGBToLinear();

  constructor(private textureModelsService: TextureModelsService) {
  }


}
