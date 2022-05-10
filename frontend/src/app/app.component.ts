import { Component } from '@angular/core';
import { TextureModelsService } from './game-base/utils/services/texture-models.service';

@Component({
  selector: 'pg-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'plane-game';

  constructor(private textureModelsService: TextureModelsService) {
    this.textureModelsService.fetchAllTextures();
  }
}
