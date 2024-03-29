import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { NgtStore } from '@angular-three/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Airport } from '@pg/game/models/airport';
import { CameraModesEnum } from '@pg/game/models/gane.enums';
import { KeyEventEnum } from '@pg/game/models/keyboard-events.types';
import { Player } from '@pg/game/models/player';
import { AirportsService } from '@pg/game/services/airports.service';
import { KeyboardAndTouchControlsService } from '@pg/game/services/keyboard-and-touch-controls.service';
import { PlayersService } from '@pg/game/services/players.service';
import { CONFIG } from '@shared/services/config.service';
import { LoaderService } from '@shared/services/loader.service';
import { filter, fromEvent, take } from 'rxjs';
import { DirectionalLight, PerspectiveCamera } from 'three';

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
  readonly wheelEvent = fromEvent<WheelEvent>(window, 'wheel');

  camera?: PerspectiveCamera;
  myPlayer?: Player;
  focusedPlayerId: string | null = null;
  cameraMode = CameraModesEnum.FOLLOW;
  isEarthRendered = false;

  constructor(
    private keyboardControlsService: KeyboardAndTouchControlsService,
    private playersService: PlayersService,
    private airportsService: AirportsService,
    private cdr: ChangeDetectorRef,
    private ngtStore: NgtStore
  ) {}

  trackById(index: number, object: Player | Airport) {
    return object.id;
  }

  onEarthRendered() {
    this.isEarthRendered = true;
    this.teleportPlaneToCorrectPosition();
    LoaderService.endLoader();
    this.setupAirportsChanges();
    this.setupPlayersChanges();
    this.setupCameraLight();
    this.setupZoomHandler();
  }

  private teleportPlaneToCorrectPosition() {
    if (this.myPlayer) {
      this.myPlayer.updatePlanePositionInstantly();
    }
  }

  private setupAirportsChanges() {
    this.airportsService.listChanged$.pipe(untilDestroyed(this)).subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  private setupPlayersChanges() {
    this.playersService.changed$.pipe(untilDestroyed(this)).subscribe(() => {
      // Already initially setup
      if (this.myPlayer || !this.playersService.myPlayer) {
        // Focused player is no longer in the game
        if (this.focusedPlayerId && !this.players.has(this.focusedPlayerId)) {
          this.focusOnMyPlayer();
          this.cdr.markForCheck();
        }
        return;
      }

      // Only first time
      this.myPlayer = this.playersService.myPlayer;
      this.focusOnMyPlayer();
      this.setupCameraControls();
      this.cdr.markForCheck();
    });

    this.playersService.playerFocus$.pipe(untilDestroyed(this)).subscribe(playerId => {
      this.focusedPlayerId = playerId;
      this.cameraMode = CameraModesEnum.FOLLOW;
    });

    this.playersService.reset$.pipe(untilDestroyed(this)).subscribe(() => {
      this.myPlayer = undefined;
      this.focusedPlayerId = null;
      this.cameraMode = CameraModesEnum.FOLLOW;
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
    this.ngtStore
      .select(state => state.camera)
      .pipe(take(1), untilDestroyed(this))
      .subscribe(camera => {
        this.camera = camera as PerspectiveCamera;
        const light = new DirectionalLight('#f0f4ff', 3);
        light.position.z = 20;
        light.position.y = 10;
        this.camera.add(light);
        this.ngtStore.get(s => s.scene).add(this.camera);
      });
  }

  private setupZoomHandler() {
    this.wheelEvent
      .pipe(
        untilDestroyed(this),
        filter(() => !!this.camera && this.cameraMode !== CameraModesEnum.FREE)
      )
      .subscribe((event: WheelEvent) => {
        CONFIG.CAMERA_FOLLOWING_HEIGHT_MULTIPLIER += event.deltaY * CONFIG.CAMERA_SCROLL_ZOOM;

        if (CONFIG.CAMERA_FOLLOWING_HEIGHT_MULTIPLIER > CONFIG.CAMERA_FOLLOWING_HEIGHT_MULTIPLIER_MAX) {
          CONFIG.CAMERA_FOLLOWING_HEIGHT_MULTIPLIER = CONFIG.CAMERA_FOLLOWING_HEIGHT_MULTIPLIER_MAX;
          return;
        }

        if (CONFIG.CAMERA_FOLLOWING_HEIGHT_MULTIPLIER < CONFIG.CAMERA_FOLLOWING_HEIGHT_MULTIPLIER_MIN) {
          CONFIG.CAMERA_FOLLOWING_HEIGHT_MULTIPLIER = CONFIG.CAMERA_FOLLOWING_HEIGHT_MULTIPLIER_MIN;
          return;
        }
      });
  }
}
