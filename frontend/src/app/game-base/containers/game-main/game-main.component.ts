import { Component } from '@angular/core';
import { NgtCameraOptions, NgtGLOptions } from '@angular-three/core/lib/types';
import { PCFSoftShadowMap, WebGLShadowMap } from 'three';

@Component({
  selector: 'pg-game-main',
  templateUrl: './game-main.component.html',
  styleUrls: ['./game-main.component.scss']
})
export class GameMainComponent {
  readonly cameraOptions: NgtCameraOptions = {
    zoom: 1,
    position: [0, 15, 50]
  };
  readonly rendererOptions: NgtGLOptions = {
    physicallyCorrectLights: true,
  };
  readonly shadowOptions: Partial<WebGLShadowMap> = {
    enabled: true,
    type: PCFSoftShadowMap
  };
}
