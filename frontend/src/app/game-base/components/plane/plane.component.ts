import { Component, Input } from '@angular/core';
import { degToRad } from 'three/src/math/MathUtils';
import { NgtEuler, NgtRenderState, NgtVector3 } from '@angular-three/core';
import { Group } from 'three';
import { TextureModelsService } from '../../utils/services/texture-models.service';
import { GeoLocationPoint } from '../../utils/models/game.types';
import { DEFAULT_PLANE_STATE, DIRECTION, EARTH_RADIUS, MAP_SCALE } from '../../utils/models/game.constants';
import { calculateCircumference } from '../../utils/utils';

@Component({
  selector: 'pg-plane',
  templateUrl: './plane.component.html',
})
export class PlaneComponent {
  @Input() set startingPosition(position: GeoLocationPoint) {
    // TODO calculate starting rotation and position
  }

  @Input() set direction(direction: number) {
    // Correct last direction if went out of scale
    if (Math.abs(direction - this.lastDirection) > DIRECTION.max / 2) {
      if (this.lastDirection > DIRECTION.max / 2) {
        this.lastDirection -= DIRECTION.max;
      } else {
        this.lastDirection += DIRECTION.max;
      }
    }
    // Update current direction
    this.currentDirection = direction;
  }

  @Input() speed = DEFAULT_PLANE_STATE.speed;

  private lastDirection: number = DEFAULT_PLANE_STATE.direction;
  private currentDirection: number = DEFAULT_PLANE_STATE.direction;

  readonly textures$ = this.textureModelsService.planeTextures$;

  readonly MOVING_RADIUS = EARTH_RADIUS + 1;
  readonly MOVING_CIRCUMFERENCE = calculateCircumference(this.MOVING_RADIUS);

  startingPositionVector: NgtVector3 = [0, 0, this.MOVING_RADIUS];
  startingRotationVector: NgtEuler = [0, Math.PI, 0];

  constructor(private textureModelsService: TextureModelsService) {}

  updatePlane(event: { state: NgtRenderState; object: Group }) {
    this.updatePlaneDirection(event.object);
    this.movePlaneForward(event.object);
  }

  private updatePlaneDirection(plane: Group) {
    // Update direction gradually
    const currentDirectionDifference = this.currentDirection - this.lastDirection;
    // Rotate according to difference
    if (Math.abs(currentDirectionDifference) > 0.1) {
      const currentDifference = currentDirectionDifference / 30; // Divide change into 30 frames
      plane.rotateZ(degToRad(currentDifference));
      this.lastDirection += currentDifference;
    } else {
      // If difference very small - update lastdirection and make dinal rotation
      plane.rotateZ(degToRad(currentDirectionDifference));
      this.lastDirection = this.currentDirection;
    }
  }

  private movePlaneForward(plane: Group) {
    // Move forward by speed and rotate downward to continue nosing down with curvature of earth
    plane.rotateX(degToRad(((this.speed * MAP_SCALE) / this.MOVING_CIRCUMFERENCE) * 360));
    plane.translateY(this.speed * MAP_SCALE);
  }
}
