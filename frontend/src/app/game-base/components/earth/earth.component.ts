import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { NgtMesh } from '@angular-three/core/meshes';
import { EARTH_RADIUS } from '@pg/game-base/models/game.constants';
import { TextureModelsService } from '@pg/game-base/services/texture-models.service';
import { LoaderService } from '@shared/services/loader.service';

@Component({
  selector: 'pg-earth',
  templateUrl: './earth.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EarthComponent {
  @ViewChild(NgtMesh) set earth(earth: NgtMesh | null) {
    if (earth && !this.isloaded) {
      earth.instanceValue.onAfterRender = () => {
        if (!this.isloaded) {
          this.isloaded = true;
          LoaderService.endLoader();
        }
      };
    }
  }

  readonly EARTH_RADIUS = EARTH_RADIUS;

  textures$ = this.textureModelsService.earthTextures$;

  private isloaded = false;

  constructor(private textureModelsService: TextureModelsService) {}
}
