import { ChangeDetectionStrategy, Component, Input, ViewChild } from '@angular/core';
import { NgtCamera } from '@angular-three/core';
import { NgtPrimitive } from '@angular-three/core/primitive';
import { BeforeRenderedObject } from '@pg/game-base/models/game.types';
import { Player } from '@pg/game-base/players/models/player';
import { map } from 'rxjs';
import { Euler, Object3D, Vector3 } from 'three';
import { degToRad } from 'three/src/math/MathUtils';

import { MAP_SCALE, MOVING_CIRCUMFERENCE } from '../../../constants/game.constants';
import { TextureModelsService } from '../../../services/texture-models.service';

@Component({
  selector: 'pg-plane',
  templateUrl: './plane.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaneComponent {
  @ViewChild(NgtPrimitive) set plane(plane: NgtPrimitive) {
    this.player.planeObject = plane?.instanceValue;
  }

  @Input() set position(position: Vector3) {
    if (!this.initialPosition || !this.player.planeObject) {
      this.initialPosition = position;
    }
    this.targetPosition = position;
  }

  @Input() camera?: NgtCamera;
  @Input() player!: Player;
  @Input() cameraFollowing = false;

  readonly textures$ = this.textureModelsService.planeTextures$.pipe(
    map(({ model, trail }) => ({ model: model.clone(true), trail }))
  );
  initialPosition?: Vector3;
  targetPosition?: Vector3;

  constructor(private textureModelsService: TextureModelsService) {}

  updatePlane(event: BeforeRenderedObject) {
    this.movePlane(event.object, event.state.delta);
    this.focusCameraOnPlayer(event.object);
  }

  private movePlane(plane: Object3D, delta: number) {
    const positionCopy = plane.position.clone();

    // Move forward by displacement and rotate downward to continue nosing down with curvature of earth
    const displacement = (this.player.velocity / 3600) * MAP_SCALE * delta; // delta in s convert to h
    plane.rotateX(degToRad((displacement / MOVING_CIRCUMFERENCE) * 360));
    plane.translateY(displacement);

    // Update targets by current movement
    this.updateByDifference(this.targetPosition!, positionCopy, plane.position, 1, 0.0000000001);

    // Update position and rotation up to target gradually
    this.updateByDifference(plane.position, plane.position, this.targetPosition!, 0.01);
  }

  private focusCameraOnPlayer(plane: Object3D) {
    if (this.cameraFollowing && this.camera) {
      const position = plane.position.clone().multiplyScalar(1.2);
      this.camera.position.set(position.x, position.y, position.z);
    }
  }

  private updateByDifference<T extends Euler | Vector3>(
    target: T,
    start: T,
    end: T,
    multiplier = 1,
    accuracy = 0.00001
  ): void {
    this.updateOneByDifference('x', target, start, end, multiplier, accuracy);
    this.updateOneByDifference('y', target, start, end, multiplier, accuracy);
    this.updateOneByDifference('z', target, start, end, multiplier, accuracy);
  }

  private updateOneByDifference<T extends Euler | Vector3>(
    direction: 'x' | 'y' | 'z',
    target: T,
    start: T,
    end: T,
    multiplier: number,
    accuracy: number
  ) {
    const difference = end[direction] - start[direction];
    if (Math.abs(difference) > accuracy) {
      target[direction] += difference * multiplier;
    }
  }
}
