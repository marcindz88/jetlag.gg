import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { NgtCameraOptions, NgtVector3 } from '@angular-three/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Player } from '@pg/game-base/players/models/player';
import { PlayersService } from '@pg/game-base/players/services/players.service';
import { RENDERER_OPTIONS, SHADOW_OPTIONS } from '@shared/constants/renderer-options';
import { CONFIG } from '@shared/services/config.service';
import { takeWhile } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'pg-game-main',
  templateUrl: './game-main.component.html',
  styleUrls: ['./game-main.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameMainComponent {
  readonly RENDERER_OPTIONS = RENDERER_OPTIONS;
  readonly SHADOW_OPTIONS = SHADOW_OPTIONS;
  readonly CONFIG = CONFIG;
  readonly cameraPosition: NgtVector3 = [0, 15, 50];
  readonly cameraOptions: NgtCameraOptions = {
    zoom: CONFIG.CAMERA_DEFAULT_ZOOM,
    position: this.cameraPosition,
  };

  players?: Map<string, Player>;

  constructor(private playersService: PlayersService, private cdr: ChangeDetectorRef) {
    this.setupPlayersChanges();
  }

  private setupPlayersChanges() {
    this.playersService.changed$
      .pipe(
        untilDestroyed(this),
        takeWhile(() => !this.players)
      )
      .subscribe(() => {
        if (this.playersService.players.size) {
          this.players = this.playersService.players;
          this.cdr.markForCheck();
        }
      });
  }
}
