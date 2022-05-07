import { Injectable } from '@angular/core';
import { combineLatest, filter, map, Observable, shareReplay } from 'rxjs';
import { Mesh, Texture, TextureLoader } from 'three';
import { NgtLoader } from '@angular-three/core';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

@Injectable()
export class TextureModelsService {
  earthTextures$ = combineLatest([
    this.ngtLoader.use(TextureLoader, 'assets/earthbump.jpg'),
    this.ngtLoader.use(TextureLoader, 'assets/earthmap.jpg'),
    this.ngtLoader.use(TextureLoader, 'assets/earthspec.jpg'),
  ]).pipe(
    filter(textures => textures.every(Boolean)),
    map(([bump, map, spec]) => ({ bump, map, spec })),
    shareReplay(1)
  );

  planeTextures$: Observable<{ trail: Texture, model: Mesh[] }> = combineLatest([
    this.ngtLoader.use(TextureLoader, 'assets/mask.png'),
    this.ngtLoader.use(GLTFLoader, 'assets/plane/scene.glb')
      .pipe(
        map(scene => scene.scene.children[0].children as Mesh[]),
      ),
  ]).pipe(
    filter(textures => textures.every(Boolean)),
    map(([trail, model]) => ({ trail, model })),
    shareReplay(1)
  );

  constructor(private ngtLoader: NgtLoader) {
  }

}
