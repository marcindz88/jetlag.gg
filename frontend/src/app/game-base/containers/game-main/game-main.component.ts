import { Component, HostListener } from '@angular/core';
import { NgtCameraOptions, NgtGLOptions } from '@angular-three/core/lib/types';
import { PCFSoftShadowMap, WebGLShadowMap } from 'three';
import { PlaneState } from '../../utils/models/game.types';
import { DEFAULT_PLANE_STATE } from '../../utils/models/game.constants';
import { DirectionEnum } from '../../utils/models/game.enums';

@Component({
  selector: 'pg-game-main',
  templateUrl: './game-main.component.html',
  styleUrls: ['./game-main.component.scss']
})
export class GameMainComponent {
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    this.handleChangeOfDirection(event.key);
  }

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

  myPlaneState: PlaneState = DEFAULT_PLANE_STATE;


  handleChangeOfDirection(keyCode: string) {
    switch (keyCode) {
      case 'ArrowLeft':
        this.myPlaneState.direction = DirectionEnum.LEFT;
        break;
      case 'ArrowRight':
        this.myPlaneState.direction = DirectionEnum.RIGHT;
        break;
      case 'ArrowUp':
        this.myPlaneState.direction = DirectionEnum.FORWARD;
        break;
    }
  }
}
