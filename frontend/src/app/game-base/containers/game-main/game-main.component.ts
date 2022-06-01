import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { NgtCanvas, NgtVector3 } from '@angular-three/core';
import { NgtCameraOptions } from '@angular-three/core/lib/types';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Airport } from '@pg/game-base/airports/models/airport';
import { AirportsService } from '@pg/game-base/airports/services/airports.service';
import { CameraModesEnum } from '@pg/game-base/models/gane.enums';
import { Player } from '@pg/game-base/players/models/player';
import { PlayersService } from '@pg/game-base/players/services/players.service';
import { RENDERER_OPTIONS, SHADOW_OPTIONS } from '@shared/constants/renderer-options';
import { CONFIG } from '@shared/services/config.service';
import { Camera } from 'three';

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
  @ViewChild(NgtCanvas) set ngtCanvas(ngtCanvas: NgtCanvas | null) {
    if (ngtCanvas) {
      this.camera = ngtCanvas.cameraRef.value;
    }
  }
  readonly RENDERER_OPTIONS = RENDERER_OPTIONS;
  readonly SHADOW_OPTIONS = SHADOW_OPTIONS;
  readonly CameraModesEnum = CameraModesEnum;
  readonly CONFIG = CONFIG;
  readonly players = this.playersService.players;
  readonly airports = this.airportsService.airports;

  myPlayer?: Player;
  focusedPlayerId: string | null = null;
  cameraMode = CameraModesEnum.FOLLOW;
  cameraPosition: NgtVector3 = [0, 15, 50];
  cameraOptions: NgtCameraOptions = {
    zoom: CONFIG.CAMERA_DEFAULT_ZOOM,
    position: this.cameraPosition,
  };

  camera?: Camera;

  constructor(
    private keyboardControlsService: KeyboardControlsService,
    private playersService: PlayersService,
    private airportsService: AirportsService,
    private cdr: ChangeDetectorRef
  ) {
    this.setupAirportsChanges();
    this.setupPlayersChanges();
  }

  trackById(index: number, object: Player | Airport) {
    return object.id;
  }

  private setupAirportsChanges() {
    this.airportsService.listChanged$.pipe(untilDestroyed(this)).subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  private setupPlayersChanges() {
    this.playersService.changed$.pipe(untilDestroyed(this)).subscribe(() => {
      if (this.myPlayer || !this.playersService.myPlayer) {
        // Focused player is no longer in the game
        if (this.focusedPlayerId && !this.players.has(this.focusedPlayerId)) {
          this.focusOnMyPlayer();
        }
        return;
      }
      this.myPlayer = this.playersService.myPlayer;
      this.focusOnMyPlayer();
      this.setupPlaneUpdates();
      this.setupCameraControls();
      this.cdr.markForCheck();
    });
  }

  private setupPlaneUpdates() {
    this.myPlayer!.flightParametersChanged$.pipe(untilDestroyed(this)).subscribe(() => {
      this.playersService.emitPlayerPositionUpdate(this.myPlayer!);
    });
  }

  private setupCameraControls() {
    this.keyboardControlsService.setupKeyEvent(KeyEventEnum.PLAYER_FOCUS, this, this.switchCameraFocus.bind(this));
    this.keyboardControlsService.setupKeyEvent(KeyEventEnum.CAMERA, this, this.switchCameraMode.bind(this));
  }

  private focusOnMyPlayer() {
    this.focusedPlayerId = this.myPlayer!.id;
  }

  private switchCameraFocus() {
    if (!this.focusedPlayerId) {
      this.focusOnMyPlayer();
      return;
    }

    const playerIds = Array.from(this.players.keys());
    const focusedPlayerIndex = playerIds.findIndex(playerId => playerId === this.focusedPlayerId);

    // Player not found (removed - set to my player)
    if (focusedPlayerIndex === -1) {
      this.focusOnMyPlayer();
      return;
    }

    // Next player available move to next
    if (focusedPlayerIndex + 1 < playerIds.length) {
      this.focusedPlayerId = playerIds[focusedPlayerIndex + 1];
      return;
    }

    // Last player -> jump to first
    this.focusedPlayerId = playerIds[0];
  }

  private switchCameraMode() {
    if (this.cameraMode + 1 >= CONFIG.CAMERA_NUMBER_OF_MODES) {
      this.cameraMode = CameraModesEnum.FREE;
    } else {
      this.cameraMode++;
    }
  }
}
