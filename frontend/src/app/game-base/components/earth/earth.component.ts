import { ChangeDetectionStrategy, Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { NgtMesh } from '@angular-three/core/meshes';
import { TextureModelsService } from '@pg/game-base/services/texture-models.service';
import { CONFIG } from '@shared/services/config.service';

@Component({
  selector: 'pg-earth',
  templateUrl: './earth.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EarthComponent {
  @Output() loaded = new EventEmitter<void>();

  @ViewChild(NgtMesh) set earth(earth: NgtMesh | null) {
    if (earth && !this.isloaded) {
      earth.instanceValue.onAfterRender = () => {
        if (!this.isloaded) {
          this.isloaded = true;
          this.loaded.emit();
        }
      };
    }
  }

  readonly EARTH_RADIUS = CONFIG.EARTH_RADIUS_SCALED;

  textures$ = this.textureModelsService.earthTextures$;

  private isloaded = false;

  constructor(private textureModelsService: TextureModelsService) {}
}
