import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { NgtCanvas, NgtVector3 } from '@angular-three/core';
import { NgtCameraOptions } from '@angular-three/core/lib/types';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { OtherPlayer } from '@pg/players/models/player.types';
import { PlayersService } from '@pg/players/services/players.service';
import { RENDERER_OPTIONS, SHADOW_OPTIONS } from '@shared/constants/renderer-options';

import { BEARING, VELOCITY } from '../../models/game.constants';
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
  @ViewChild(NgtCanvas) ngtCanvas: NgtCanvas | null = null;
  readonly RENDERER_OPTIONS = RENDERER_OPTIONS;
  readonly SHADOW_OPTIONS = SHADOW_OPTIONS;
  readonly players = this.playersService.players;

  myPlayer = this.playersService.myPlayer;
  focusedPlayerIndex = 0;
  followingPlayer = false;
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
  }

  trackById(index: number, player: OtherPlayer) {
    return player.id;
  }

  private setupPlayersChanges() {
    this.playersService.changed$.pipe(untilDestroyed(this)).subscribe(() => {
      if (this.myPlayer || !this.playersService.myPlayer) {
        return;
      }
      this.myPlayer = this.playersService.myPlayer;
      this.setupPlaneUpdates();
      this.setupCameraControls();
      this.setupPlaneControls();
      this.cdr.markForCheck();
    });
  }

  private setupPlaneControls() {
    this.keyboardControlsService.setupKeyEvent(KeyEventEnum.LEFT, this, () =>
      this.myPlayer!.updateBearing(-BEARING.step)
    );
    this.keyboardControlsService.setupKeyEvent(KeyEventEnum.RIGHT, this, () =>
      this.myPlayer!.updateBearing(BEARING.step)
    );
    this.keyboardControlsService.setupKeyEvent(KeyEventEnum.BACKWARD, this, () =>
      this.myPlayer!.updateVelocity(-VELOCITY.step)
    );
    this.keyboardControlsService.setupKeyEvent(KeyEventEnum.FORWARD, this, () =>
      this.myPlayer!.updateVelocity(VELOCITY.step)
    );
  }

  private setupPlaneUpdates() {
    this.myPlayer!.flightParametersChanged$.pipe(untilDestroyed(this)).subscribe(() => {
      this.playersService.emitPlayerPositionUpdate(this.myPlayer!);
    });
  }

  private setupCameraControls() {
    this.keyboardControlsService.setupKeyEvent(KeyEventEnum.CAMERA_FOCUS, this, this.switchCameraFocus.bind(this));
    this.keyboardControlsService.setupKeyEvent(KeyEventEnum.CAMERA_FOLLOW, this, this.swtchCameraFollowing.bind(this));
  }

  private switchCameraFocus() {
    if (this.focusedPlayerIndex + 1 === this.players.size) {
      this.focusedPlayerIndex = 0;
    } else {
      this.focusedPlayerIndex++;
    }
  }

  private swtchCameraFollowing() {
    this.followingPlayer = !this.followingPlayer;
  }
}
