import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgtEuler, NgtVector3 } from '@angular-three/core';
import { TextureModelsService } from '@pg/game/services/texture-models.service';
import { Material } from 'three';

@Component({
  selector: 'pg-elevated-text',
  templateUrl: './elevated-text.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ElevatedTextComponent {
  readonly materials = this.textureModelsService.materials;

  @Input() text!: string;
  @Input() position: NgtVector3 = [0, -0.5, -0.2];
  @Input() rotation: NgtEuler = [0, 0, 0];
  @Input() height = 0.1;
  @Input() size = 0.5;
  @Input() colors: Material[] = [
    this.textureModelsService.materials.textMaterialLight,
    this.textureModelsService.materials.textMaterialDark,
  ];

  constructor(private textureModelsService: TextureModelsService) {}
}
