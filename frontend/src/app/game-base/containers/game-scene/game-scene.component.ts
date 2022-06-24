import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgtStore } from '@angular-three/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Airport } from '@pg/game-base/airports/models/airport';
import { AirportsService } from '@pg/game-base/airports/services/airports.service';
import { CameraModesEnum } from '@pg/game-base/models/gane.enums';
import { Player } from '@pg/game-base/players/models/player';
import { PlayersService } from '@pg/game-base/players/services/players.service';
import { NotificationComponent } from '@shared/components/notification/notification.component';
import { CONFIG } from '@shared/services/config.service';
import { take } from 'rxjs';
import { DirectionalLight, PerspectiveCamera } from 'three';

import { KeyEventEnum } from '../../models/keyboard.types';
import { KeyboardControlsService } from '../../services/keyboard-controls.service';

@UntilDestroy()
@Component({
  selector: 'pg-game-scene',
  templateUrl: './game-scene.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameSceneComponent {
  readonly CameraModesEnum = CameraModesEnum;
  readonly CONFIG = CONFIG;
  readonly players = this.playersService.players;
  readonly playersSorted$ = this.playersService.playersSorted$;
  readonly airports = this.airportsService.airports;

  camera?: PerspectiveCamera;
  myPlayer?: Player;
  focusedPlayerId: string | null = null;
  cameraMode = CameraModesEnum.FOLLOW;

  constructor(
    private keyboardControlsService: KeyboardControlsService,
    private playersService: PlayersService,
    private airportsService: AirportsService,
    private cdr: ChangeDetectorRef,
    private ngtStore: NgtStore,
    private matSnackbar: MatSnackBar
  ) {
    this.setupAirportsChanges();
    this.setupPlayersChanges();
    this.setupCameraLight();
    this.showHelpInfo();
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
    this.keyboardControlsService.setupKeyEvent(KeyEventEnum.PLAYER_FOCUS_NEXT, this, () => this.switchCameraFocus(1));
    this.keyboardControlsService.setupKeyEvent(KeyEventEnum.PLAYER_FOCUS_PREV, this, () => this.switchCameraFocus(-1));
    this.keyboardControlsService.setupKeyEvent(KeyEventEnum.PLAYER_SELF_FOCUS, this, this.focusOnMyPlayer.bind(this));
    this.keyboardControlsService.setupKeyEvent(KeyEventEnum.CAMERA, this, this.switchCameraMode.bind(this));
  }

  private focusOnMyPlayer() {
    this.focusedPlayerId = this.myPlayer!.id;
  }

  private switchCameraFocus(change: number) {
    if (!this.focusedPlayerId) {
      this.focusOnMyPlayer();
      return;
    }

    const playerIds = this.playersSorted$.value.map(player => player.id);
    const focusedPlayerIndex = playerIds.findIndex(playerId => playerId === this.focusedPlayerId);

    // Player not found (removed - set to my player)
    if (focusedPlayerIndex === -1) {
      this.focusOnMyPlayer();
      return;
    }

    const newIndex = focusedPlayerIndex + change;

    if (newIndex >= playerIds.length) {
      // Last player -> jump to first
      this.focusedPlayerId = playerIds[0];
      return;
    }

    if (newIndex < 0) {
      // First player and go back (negative index)
      this.focusedPlayerId = playerIds.pop()!;
      return;
    }

    // Correct new index
    this.focusedPlayerId = playerIds[newIndex];
  }

  private switchCameraMode() {
    if (this.cameraMode + 1 >= CONFIG.CAMERA_NUMBER_OF_MODES) {
      this.cameraMode = CameraModesEnum.FREE;
    } else {
      this.cameraMode++;
    }
  }

  private setupCameraLight() {
    this.ngtStore.camera$.pipe(take(1), untilDestroyed(this)).subscribe(camera => {
      this.camera = camera as PerspectiveCamera;
      const light = new DirectionalLight('#f0f4ff', 3);
      light.position.z = 20;
      light.position.y = 10;
      this.camera.add(light);
      this.ngtStore.get(s => s.scene).add(this.camera);
    });
  }

  private showHelpInfo() {
    this.matSnackbar.openFromComponent(NotificationComponent, {
      data: { text: 'You can access help and steering info by pressing [H]', icon: 'info' },
      duration: 5000,
    });
  }
}
