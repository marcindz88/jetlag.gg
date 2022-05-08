import { Component, Input } from '@angular/core';
import { TextureModelsService } from '../../utils/services/texture-models.service';
import { NgtEuler, NgtRenderState, NgtVector3 } from '@angular-three/core';
import { Group } from 'three';
import { GeoLocationPoint } from '../../utils/models/game.types';
import { DEFAULT_PLANE_STATE, EARTH_RADIUS } from '../../utils/models/game.constants';
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

  @Input() direction: number = DEFAULT_PLANE_STATE.direction;
  @Input() speed = DEFAULT_PLANE_STATE.speed;

  private lastDirection: number = DEFAULT_PLANE_STATE.direction;

  readonly textures$ = this.textureModelsService.planeTextures$;

  readonly SPEED_DIVISOR = 100;
  readonly MOVING_RADIUS = EARTH_RADIUS + 1;
  readonly MOVING_CIRCUMFERENCE = calculateCircumference(this.MOVING_RADIUS);

  startingPositionVector: NgtVector3 = [0, 0, this.MOVING_RADIUS];
  startingRotationVector: NgtEuler = [0, Math.PI, 0];

  constructor(private textureModelsService: TextureModelsService) {
  }

  updatePlane(event: { state: NgtRenderState; object: Group }) {
    // Update direction gradually
    const currentDirectionDifference = this.direction - this.lastDirection;
    if (Math.abs(currentDirectionDifference) > 0.1) {
      const currentDifference = currentDirectionDifference / 30; // Divide change into 30 frames
      event.object.rotateZ(degToRad(currentDifference));
      this.lastDirection = this.lastDirection + currentDifference;
    } else {
      event.object.rotateZ(degToRad(currentDirectionDifference));
      this.lastDirection = this.direction;
    }

    // Move forward by speed
    event.object.rotateX(this.angle);
    event.object.translateY(this.speed / this.SPEED_DIVISOR);
  }

  private get angle() {
    return degToRad(this.speed / this.SPEED_DIVISOR / this.MOVING_CIRCUMFERENCE * 360);
  }
}
