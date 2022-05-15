import { Injectable } from '@angular/core';
import { NgtLoader } from '@angular-three/core';
import { BehaviorSubject, combineLatest, filter, map, Observable, shareReplay } from 'rxjs';
import { Object3D, Texture, TextureLoader } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

@Injectable({ providedIn: 'root' })
export class TextureModelsService {
  earthTextures$!: Observable<{ bump: Texture; map: Texture; spec: Texture }>;
  planeTextures$!: Observable<{ trail: Texture; model: Object3D }>;
  loading$ = new BehaviorSubject<boolean>(true);

  constructor(private ngtLoader: NgtLoader) {
    this.earthTextures$ = this.fetchEarthTextures();
    this.planeTextures$ = this.fetchPlaneTextures();
  }

  prefetchAllTextures() {
    combineLatest([this.earthTextures$, this.planeTextures$]).subscribe(() => this.loading$.next(false));
  }

  private fetchEarthTextures() {
    return combineLatest([
      this.ngtLoader.use(TextureLoader, 'assets/earth/earthbump.jpg'),
      this.ngtLoader.use(TextureLoader, 'assets/earth/earthmap.jpg'),
      this.ngtLoader.use(TextureLoader, 'assets/earth/earthspec.jpg'),
    ]).pipe(
      filter(textures => textures.every(Boolean)),
      map(([bump, map, spec]) => ({ bump, map, spec })),
      shareReplay(1)
    );
  }

  private fetchPlaneTextures() {
    return combineLatest([
      this.ngtLoader.use(TextureLoader, 'assets/mask.png'),
      this.ngtLoader.use(GLTFLoader, 'assets/plane/scene.glb').pipe(map(model => model.scene.children[0])),
    ]).pipe(
      filter(textures => textures.every(Boolean)),
      map(([trail, model]) => ({ trail, model })),
      shareReplay(1)
    );
  }
}
