import { Injectable } from '@angular/core';
import { NgtLoader } from '@angular-three/core';
import { combineLatest, filter, map, Observable, shareReplay } from 'rxjs';
import { Color, MeshStandardMaterial, Object3D, Texture, TextureLoader } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

@Injectable({ providedIn: 'root' })
export class TextureModelsService {
  earthTextures$!: Observable<{ bump: Texture; map: Texture; spec: Texture }>;
  planeTextures$!: Observable<{ model: Object3D }>;
  airportTextures$!: Observable<{
    model: Object3D;
    shadeColor: Color;
  }>;

  materials = {
    textMaterialX: new MeshStandardMaterial({ color: new Color('#ffffff') }),
    textMaterialY: new MeshStandardMaterial({ color: new Color('#1a1919') }),
  };

  constructor(private ngtLoader: NgtLoader) {
    this.earthTextures$ = this.fetchEarthTextures();
    this.planeTextures$ = this.fetchPlaneTextures();
    this.airportTextures$ = this.fetchAirportTextures();
  }

  prefetchAllTextures() {
    combineLatest([this.earthTextures$, this.planeTextures$, this.airportTextures$]).subscribe();
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
      // Credits to https://sketchfab.com/maurogsw
      this.ngtLoader.use(GLTFLoader, 'assets/plane/plane.glb').pipe(map(model => model.scene.children[0])),
    ]).pipe(
      filter(textures => textures.every(Boolean)),
      map(([model]) => ({ model })),
      shareReplay(1)
    );
  }

  private fetchAirportTextures() {
    return combineLatest([
      this.ngtLoader.use(GLTFLoader, 'assets/airport/scene.glb').pipe(map(model => model.scene.children[0])),
    ]).pipe(
      filter(textures => textures.every(Boolean)),
      map(([model]) => ({
        model,
        shadeColor: new Color('#676767'),
      })),
      shareReplay(1)
    );
  }
}
