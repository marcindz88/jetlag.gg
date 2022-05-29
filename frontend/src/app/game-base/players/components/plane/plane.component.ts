import { ChangeDetectionStrategy, Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgtGroup } from '@angular-three/core/group';
import { NgtPrimitive } from '@angular-three/core/primitive';
import { BeforeRenderedObject } from '@pg/game-base/models/game.types';
import { Player } from '@pg/game-base/players/models/player';
import { map, Observable } from 'rxjs';
import { Camera, Euler, Mesh, MeshStandardMaterial, Object3D, Vector3 } from 'three';
import { degToRad } from 'three/src/math/MathUtils';

import { MAP_SCALE, MOVING_CIRCUMFERENCE } from '../../../constants/game.constants';
import { TextureModelsService } from '../../../services/texture-models.service';

@Component({
  selector: 'pg-plane',
  templateUrl: './plane.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaneComponent implements OnInit {
  @ViewChild(NgtGroup) set plane(plane: NgtPrimitive) {
    this.player.planeObject = plane?.instanceValue;
  }

  @Input() set position(position: Vector3) {
    if (!this.initialPosition || !this.player.planeObject) {
      this.initialPosition = position;
    }
    this.targetPosition = position;
  }

  @Input() camera?: Camera;
  @Input() player!: Player;
  @Input() cameraFollowing = false;
  @Input() cameraPositioning = false;

  textures$?: Observable<{ model: Object3D }>;
  initialPosition?: Vector3;
  targetPosition?: Vector3;

  readonly materials = this.textureModelsService.materials;

  constructor(private textureModelsService: TextureModelsService) {}

  ngOnInit() {
    this.textures$ = this.textureModelsService.planeTextures$.pipe(
      map(({ model }) => {
        model = model.clone(true);
        const newMaterial = this.getMaterial(model).clone();
        newMaterial.color = this.player.color;
        (model.children[0].children[0] as Mesh).material = newMaterial;
        return { model };
      })
    );
  }

  updatePlane(event: BeforeRenderedObject) {
    this.movePlane(event.object, event.state.delta);
    this.focusCameraOnPlayer(event.object);
  }

  getMaterial(model: Object3D) {
    return (model.children[0].children[0] as Mesh).material as MeshStandardMaterial;
  }

  private movePlane(plane: Object3D, delta: number) {
    if (this.player.velocity) {
      const positionCopy = plane.position.clone();

      // Move forward by displacement and rotate downward to continue nosing down with curvature of earth
      const displacement = (this.player.velocity / 3600) * MAP_SCALE * delta; // delta in s convert to h
      plane.rotateX(degToRad((displacement / MOVING_CIRCUMFERENCE) * 360));
      plane.translateY(displacement);

      // Update targets by current movement
      this.updateByDifference(this.targetPosition!, positionCopy, plane.position, 1, 0.0000000001);
    }

    // Update position up to target gradually
    this.updateByDifference(plane.position, plane.position, this.targetPosition!, 0.1);
  }

  private focusCameraOnPlayer(plane: Object3D) {
    if ((this.cameraFollowing || this.cameraPositioning) && this.camera) {
      const position = plane.position.clone().multiplyScalar(1.2);
      const mock = this.camera.clone();
      mock.position.set(position.x, position.y, position.z);
      mock.lookAt(plane.position);
      if (this.cameraPositioning) {
        mock.rotation.z -= plane.rotation.z;
      }
      this.camera.position.set(position.x, position.y, position.z);
      this.camera.quaternion.slerp(mock.quaternion, 0.1);
    }
  }

  private updateByDifference<T extends Euler | Vector3>(
    target: T,
    start: T,
    end: T,
    multiplier = 1,
    accuracy = 0.00001
  ): void {
    if (this.isDifferenceNegligible(start, end, accuracy)) {
      ['x', 'y', 'z'].forEach(direction => {
        target[direction as 'x' | 'y' | 'z'] = end[direction as 'x' | 'y' | 'z'];
      });
      return;
    }
    ['x', 'y', 'z'].forEach(direction => {
      this.updateDirectionByDifference(direction as 'x' | 'y' | 'z', target, start, end, multiplier);
    });
  }

  private isDifferenceNegligible<T extends Euler | Vector3>(start: T, end: T, accuracy: number) {
    return ['x', 'y', 'z'].every(
      (directionValue: string) =>
        Math.abs(end[directionValue as 'x' | 'y' | 'z'] - start[directionValue as 'x' | 'y' | 'z']) < accuracy
    );
  }

  private updateDirectionByDifference<T extends Euler | Vector3>(
    direction: 'x' | 'y' | 'z',
    target: T,
    start: T,
    end: T,
    multiplier: number
  ) {
    const difference = end[direction] - start[direction];
    if (difference) {
      target[direction] += difference * multiplier;
    }
  }
}
