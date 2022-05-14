import { Component } from '@angular/core';
import { ClockService } from '@shared/services/clock.service';

import { TextureModelsService } from './game-base/services/texture-models.service';

@Component({
  selector: 'pg-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'plane-game';

  constructor(private textureModelsService: TextureModelsService, private clockService: ClockService) {
    this.textureModelsService.prefetchAllTextures();
    // this.clockService.setupSyncingOfTime();
  }
}
