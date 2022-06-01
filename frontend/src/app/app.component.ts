import { Component } from '@angular/core';
import { ClockService } from '@shared/services/clock.service';
import { ConfigService } from '@shared/services/config.service';
import { LoaderService } from '@shared/services/loader.service';

import { TextureModelsService } from './game-base/services/texture-models.service';

@Component({
  selector: 'pg-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'plane-game';
  loading$ = this.loaderService.loading$;

  constructor(
    private textureModelsService: TextureModelsService,
    private clockService: ClockService,
    private configService: ConfigService,
    private loaderService: LoaderService
  ) {
    this.textureModelsService.prefetchAllTextures();
    this.clockService.setupSyncingOfTime();
    this.configService.fetchAndSetConfig();
  }
}
