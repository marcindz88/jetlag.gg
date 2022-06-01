import { ChangeDetectionStrategy, Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgtGroup } from '@angular-three/core/group';
import { NgtPrimitive } from '@angular-three/core/primitive';
import { BeforeRenderedObject } from '@pg/game-base/models/game.types';
import { CameraModesEnum } from '@pg/game-base/models/gane.enums';
import { Player } from '@pg/game-base/players/models/player';
import { PlayersService } from '@pg/game-base/players/services/players.service';
import { ClockService } from '@shared/services/clock.service';
import { CONFIG } from '@shared/services/config.service';
import { Logger } from '@shared/services/logger.service';
import { map, Observable } from 'rxjs';
import { Camera, Euler, Mesh, MeshStandardMaterial, Object3D, Vector3 } from 'three';
import { degToRad } from 'three/src/math/MathUtils';

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
  @Input() cameraMode: CameraModesEnum = CameraModesEnum.FREE;
  @Input() set isFocused(isFocused: boolean) {
    this.player.isFocused = isFocused;
    this.playersService.changed$.next();
    if (!isFocused) {
      this.cameraFocused = false;
    }
  }

  textures$?: Observable<{ model: Object3D }>;
  initialPosition?: Vector3;
  targetPosition?: Vector3;
  cameraFocused = false;

  readonly materials = this.textureModelsService.materials;

  constructor(
    private textureModelsService: TextureModelsService,
    private clockService: ClockService,
    private playersService: PlayersService
  ) {}

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
      // Suspected inactivity
      if (delta > 0.18) {
        this.recoverFromInactivity(plane, delta);
        return;
      }

      const positionCopy = plane.position.clone();

      // Move forward by displacement and rotate downward to continue nosing down with curvature of earth
      const displacement = (this.player.velocity / 3600) * CONFIG.MAP_SCALE * delta; // delta in s convert to h
      plane.rotateX(degToRad((displacement / CONFIG.FLIGHT_MOVING_CIRCUMFERENCE) * 360));
      plane.translateY(displacement);

      // Update targets by current movement
      this.updateByDifference(this.targetPosition!, positionCopy, plane.position, 1, 0.0000000001);
    }

    // Update position up to target gradually
    this.updateByDifference(plane.position, plane.position, this.targetPosition!, 0.1);
  }

  private recoverFromInactivity(plane: Object3D, delta: number) {
    if (delta > 1) {
      this.cameraFocused = false;
    }
    this.player.position = {
      ...this.player.position,
      timestamp: this.clockService.getCurrentTime() - delta * 1000,
    };
    this.updateByDifference(plane.position, plane.position, this.player.cartesianPosition, 1, 0.0000000001);
    Logger.warn(PlaneComponent, `Recovered after inactivity, delta: ${delta}`);
  }

  private focusCameraOnPlayer(plane: Object3D) {
    if (this.player.isFocused && this.cameraMode !== CameraModesEnum.FREE && this.camera) {
      const position = plane.position.clone().multiplyScalar(1.2);
      const mock = this.camera.clone();
      mock.position.set(position.x, position.y, position.z);
      mock.lookAt(plane.position);
      if (this.cameraMode === CameraModesEnum.POSITION) {
        mock.rotation.z -= plane.rotation.z;
      }
      this.camera.position.set(position.x, position.y, position.z);
      this.camera.quaternion.slerp(mock.quaternion, this.cameraFocused ? 0.1 : 1);
      this.cameraFocused = true;
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
