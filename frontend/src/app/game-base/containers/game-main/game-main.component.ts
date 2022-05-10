import { Component } from '@angular/core';
import { NgtCameraOptions, NgtGLOptions } from '@angular-three/core/lib/types';
import { PCFSoftShadowMap, WebGLShadowMap } from 'three';
import { PlaneState } from '../../utils/models/game.types';
import { DEFAULT_PLANE_STATE, DIRECTION, SPEED } from '../../utils/models/game.constants';
import { KeyboardControlsService } from '../../utils/services/keyboard-controls.service';
import { KeyEventEnum } from '../../utils/models/keyboard.types';

@Component({
  selector: 'pg-game-main',
  templateUrl: './game-main.component.html',
  styleUrls: ['./game-main.component.scss'],
})
export class GameMainComponent {
  readonly cameraOptions: NgtCameraOptions = {
    zoom: 1 / 3,
    position: [0, 15, 50],
  };
  readonly rendererOptions: NgtGLOptions = {
    physicallyCorrectLights: true,
  };
  readonly shadowOptions: Partial<WebGLShadowMap> = {
    enabled: true,
    type: PCFSoftShadowMap,
  };

  myPlaneState: PlaneState = DEFAULT_PLANE_STATE;

  constructor(private keyboardControlsService: KeyboardControlsService) {
    this.setupSteeringAndHandling();
  }

  private setupSteeringAndHandling() {
    this.keyboardControlsService.keyEvent$.subscribe((keyEvent: KeyEventEnum) => {
      switch (keyEvent) {
        case KeyEventEnum.LEFT:
          this.turnLeft();
          break;
        case KeyEventEnum.RIGHT:
          this.turnRight();
          break;
        case KeyEventEnum.BACKWARD:
          this.decelerate();
          break;
        case KeyEventEnum.FORWARD:
          this.accelerate();
          break;
      }
    });
  }

  private turnLeft() {
    this.myPlaneState.direction -= DIRECTION.step;
    if (this.myPlaneState.direction < DIRECTION.min) {
      this.myPlaneState.direction += DIRECTION.max;
    }
  }

  private turnRight() {
    this.myPlaneState.direction += DIRECTION.step;
    this.myPlaneState.direction %= DIRECTION.max;
  }

  private accelerate() {
    if (this.myPlaneState.speed + SPEED.step <= SPEED.max) {
      this.myPlaneState.speed += SPEED.step;
    }
  }

  private decelerate() {
    if (this.myPlaneState.speed - SPEED.step >= SPEED.min) {
      this.myPlaneState.speed -= SPEED.step;
    }
  }
}
