import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { NgtCanvas, NgtVector3 } from '@angular-three/core';
import { NgtCameraOptions, NgtGLOptions } from '@angular-three/core/lib/types';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { transformCoordinatesIntoPoint } from '@pg/game-base/utils/utils';
import { Player } from '@pg/players/models/player';
import { OtherPlayer } from '@pg/players/models/player.types';
import { PlayersService } from '@pg/players/services/players.service';
import { PCFSoftShadowMap, WebGLShadowMap } from 'three';

import { BEARING, CAMERA_ALTITUDE, VELOCITY } from '../../models/game.constants';
import { KeyEventEnum } from '../../models/keyboard.types';
import { KeyboardControlsService } from '../../services/keyboard-controls.service';

@UntilDestroy()
@Component({
  selector: 'pg-game-main',
  templateUrl: './game-main.component.html',
  styleUrls: ['./game-main.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameMainComponent {
  @ViewChild(NgtCanvas)
  ngtCanvas: NgtCanvas | null = null;

  readonly rendererOptions: NgtGLOptions = {
    physicallyCorrectLights: true,
  };
  readonly shadowOptions: Partial<WebGLShadowMap> = {
    enabled: true,
    type: PCFSoftShadowMap,
  };
  readonly players = this.playersService.players;
  readonly myPlayer = this.playersService.myPlayer!;

  focusedPlayerIterator: IterableIterator<Player> = this.players.values();
  cameraPosition: NgtVector3 = [0, 15, 50];
  cameraOptions: NgtCameraOptions = {
    zoom: 1 / 3,
    position: this.cameraPosition,
  };

  constructor(
    private keyboardControlsService: KeyboardControlsService,
    private playersService: PlayersService,
    private cdr: ChangeDetectorRef
  ) {
    this.setupPlayersChanges();
    this.setupCameraControls();
    this.setupPlaneControls();
  }

  trackById(index: number, player: OtherPlayer) {
    return player.id;
  }

  private setupPlayersChanges() {
    this.playersService.changed$.pipe(untilDestroyed(this)).subscribe(() => this.cdr.markForCheck());
  }

  private setupPlaneControls() {
    this.keyboardControlsService.keyEvent$.pipe(untilDestroyed(this)).subscribe((keyEvent: KeyEventEnum) => {
      switch (keyEvent) {
        case KeyEventEnum.LEFT:
          this.myPlayer.updateBearing(-BEARING.step);
          break;
        case KeyEventEnum.RIGHT:
          this.myPlayer.updateBearing(BEARING.step);
          break;
        case KeyEventEnum.BACKWARD:
          this.myPlayer.updateVelocity(-VELOCITY.step);
          break;
        case KeyEventEnum.FORWARD:
          this.myPlayer.updateVelocity(VELOCITY.step);
          break;
      }
      this.playersService.emitPlayerPositionUpdate(this.myPlayer);
    });
  }

  private setupCameraControls() {
    this.keyboardControlsService.keyEvent$.pipe(untilDestroyed(this)).subscribe((keyEvent: KeyEventEnum) => {
      switch (keyEvent) {
        case KeyEventEnum.CAMERA:
          this.switchCameraPosition();
          break;
      }
    });
  }

  private switchCameraPosition() {
    let focusedPlayerEntry = this.focusedPlayerIterator.next();
    if (focusedPlayerEntry.done) {
      this.focusedPlayerIterator = this.players.values();
      focusedPlayerEntry = this.focusedPlayerIterator.next();
    }

    // TODO use XYZ coordinates to calculate camera position and add animation
    const playerPositionXYZ = (focusedPlayerEntry.value as Player).position.coordinates;

    this.ngtCanvas?.cameraRef
      .getValue()
      .position.set(...transformCoordinatesIntoPoint(playerPositionXYZ, CAMERA_ALTITUDE));
    this.cdr.markForCheck();
  }
}
