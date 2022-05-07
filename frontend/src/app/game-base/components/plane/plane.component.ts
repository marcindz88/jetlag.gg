import { Component, Input } from '@angular/core';
import { TextureModelsService } from '../../services/texture-models.service';
import { NgtEuler, NgtRenderState, NgtVector3 } from '@angular-three/core';
import { Group, Vector3 } from 'three';
import { GeoLocationPoint } from '../../models/location.types';

@Component({
  selector: 'pg-plane',
  templateUrl: './plane.component.html',
  styleUrls: ['./plane.component.scss']
})
export class PlaneComponent {
  @Input() set startingPosition(position: GeoLocationPoint) {
    // TODO calculate starting rotation and position
  };

  @Input() speed = 0.01;

  readonly textures$ = this.textureModelsService.planeTextures$;

  startingPositionVector: NgtVector3 = [0, 0, 32];
  startingRotationVector: NgtEuler = [0, Math.PI, 0];

  constructor(private textureModelsService: TextureModelsService) {
  }

  updatePlane(event: { state: NgtRenderState; object: Group }) {
    event.object.rotateOnAxis(new Vector3(1, 0, 0), this.speed / 30);
    event.object.translateY(this.speed);
  }
}
