import { Component, Input } from '@angular/core';
import { TextureModelsService } from '../../utils/services/texture-models.service';
import { NgtEuler, NgtRenderState, NgtVector3 } from '@angular-three/core';
import { Group } from 'three';
import { GeoLocationPoint } from '../../utils/models/game.types';
import { DEFAULT_PLANE_STATE, EARTH_RADIUS } from '../../utils/models/game.constants';
import { DirectionEnum } from '../../utils/models/game.enums';
import { degToRad } from 'three/src/math/MathUtils';
import { calculateCircumference } from '../../utils/utils';

@Component({
  selector: 'pg-plane',
  templateUrl: './plane.component.html',
  styleUrls: ['./plane.component.scss']
})
export class PlaneComponent {

  @Input() set startingPosition(position: GeoLocationPoint) {
    // TODO calculate starting rotation and position
  };

  @Input() direction: DirectionEnum = DEFAULT_PLANE_STATE.direction;
  @Input() speed = DEFAULT_PLANE_STATE.speed;

  readonly textures$ = this.textureModelsService.planeTextures$;

  readonly SPEED_DIVISOR = 100;
  readonly MOVING_RADIUS = EARTH_RADIUS + 1;
  readonly MOVING_CIRCUMFERENCE = calculateCircumference(this.MOVING_RADIUS);

  startingPositionVector: NgtVector3 = [0, 0, this.MOVING_RADIUS];
  startingRotationVector: NgtEuler = [0, Math.PI, 0];

  constructor(private textureModelsService: TextureModelsService) {
  }

  updatePlane(event: { state: NgtRenderState; object: Group }) {
    switch (this.direction) {
      case DirectionEnum.FORWARD:
        event.object.rotateX(this.angle);
        event.object.translateY(this.speed / this.SPEED_DIVISOR);
        break;
      case DirectionEnum.LEFT:
        event.object.rotateY(-this.angle);
        event.object.translateX(this.speed / this.SPEED_DIVISOR);
        break;
      case DirectionEnum.RIGHT:
        event.object.rotateY(this.angle);
        event.object.translateX(-this.speed / this.SPEED_DIVISOR);
        break;
    }
  }

  private get angle() {
    return degToRad(this.speed / this.SPEED_DIVISOR / this.MOVING_CIRCUMFERENCE * 360);
  }
}
