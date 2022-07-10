import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCameraOptions } from '@angular-three/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { RENDERER_OPTIONS, SHADOW_OPTIONS } from '@shared/constants/renderer-options';
import { CONFIG } from '@shared/services/config.service';

@UntilDestroy()
@Component({
  selector: 'pg-game-main',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameComponent {
  readonly RENDERER_OPTIONS = RENDERER_OPTIONS;
  readonly SHADOW_OPTIONS = SHADOW_OPTIONS;
  readonly cameraOptions: NgtCameraOptions = {
    zoom: CONFIG.CAMERA_DEFAULT_ZOOM,
    position: [0, 15, 50],
  };
}
