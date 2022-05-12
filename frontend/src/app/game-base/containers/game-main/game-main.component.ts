import { Component } from '@angular/core';
import { NgtCameraOptions, NgtGLOptions } from '@angular-three/core/lib/types';
import { PCFSoftShadowMap, WebGLShadowMap } from 'three';
import { BEARING, SPEED } from '../../utils/models/game.constants';
import { KeyboardControlsService } from '../../utils/services/keyboard-controls.service';
import { KeyEventEnum } from '../../utils/models/keyboard.types';
import { MyPlayer, OtherPlayer } from '../../../players/models/player.types';
import { Observable } from 'rxjs';
import { PlayersService } from '../../../players/services/players.service';
import { MyPlayerService } from '../../../players/services/my-player.service';

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

  playersState$: Observable<OtherPlayer[]> = this.playersService.players$;
  myPlayer: MyPlayer = this.myPlayerService.player$.value!;

  constructor(
    private keyboardControlsService: KeyboardControlsService,
    private playersService: PlayersService,
    private myPlayerService: MyPlayerService
  ) {
    this.setupSteeringAndHandling();
  }

  trackById(index: number, player: OtherPlayer) {
    return player.id;
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
      this.playersService.updatePlayerAndEmitPositionUpdate(this.myPlayer);
    });
  }

  private turnLeft() {
    this.myPlayer.position.bearing -= BEARING.step;
    if (this.myPlayer.position.bearing < BEARING.min) {
      this.myPlayer.position.bearing += BEARING.max;
    }
  }

  private turnRight() {
    this.myPlayer.position.bearing += BEARING.step;
    this.myPlayer.position.bearing %= BEARING.max;
  }

  private accelerate() {
    if (this.myPlayer.position.velocity + SPEED.step <= SPEED.max) {
      this.myPlayer.position.velocity += SPEED.step;
    }
  }

  private decelerate() {
    if (this.myPlayer.position.velocity - SPEED.step >= SPEED.min) {
      this.myPlayer.position.velocity -= SPEED.step;
    }
  }
}
