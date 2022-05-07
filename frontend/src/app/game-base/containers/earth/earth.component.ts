import { Component } from '@angular/core';
import { Color, FloatType, PMREMGenerator, TextureLoader, WebGLRenderer } from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { NgtLoader } from '@angular-three/core';
import { combineLatest, from, map } from 'rxjs';

@Component({
  selector: 'pg-earth',
  templateUrl: './earth.component.html',
  styleUrls: ['./earth.component.scss']
})
export class EarthComponent {
  textures$ = combineLatest([
    this.ngtLoader.use(TextureLoader, 'assets/earthbump.jpg'),
    this.ngtLoader.use(TextureLoader, 'assets/earthmap.jpg'),
    this.ngtLoader.use(TextureLoader, 'assets/earthspec.jpg'),
    this.fetchEnvMap()
  ]).pipe(map(([bump, map, spec, env]) => ({ bump, map, spec, env })));

  sheenColor = new Color('#ff8a00').convertSRGBToLinear();

  private pmrem = new PMREMGenerator(new WebGLRenderer());

  constructor(private ngtLoader: NgtLoader) {
  }

  fetchEnvMap() {
    return from(new RGBELoader()
      .setDataType(FloatType)
      .loadAsync('assets/old_room_2k.hdr') // thanks to https://polyhaven.com/hdris !
    ).pipe(map(envmapTexture => this.pmrem.fromEquirectangular(envmapTexture).texture));
  }
}
