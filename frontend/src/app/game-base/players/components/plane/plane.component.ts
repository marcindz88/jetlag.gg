import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgtGroup } from '@angular-three/core/group';
import { NgtPrimitive } from '@angular-three/core/primitive';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BeforeRenderedObject } from '@pg/game-base/models/game.types';
import { CameraModesEnum } from '@pg/game-base/models/gane.enums';
import { Player } from '@pg/game-base/players/models/player';
import { PlayersService } from '@pg/game-base/players/services/players.service';
import { calculateAltitudeFromPosition } from '@pg/game-base/utils/geo-utils';
import { determineDisplacement } from '@pg/game-base/utils/velocity-utils';
import { ClockService } from '@shared/services/clock.service';
import { CONFIG } from '@shared/services/config.service';
import { map, Observable } from 'rxjs';
import { Camera, Euler, Mesh, MeshStandardMaterial, Object3D, Vector3 } from 'three';
import { degToRad } from 'three/src/math/MathUtils';

import { TextureModelsService } from '../../../services/texture-models.service';

@UntilDestroy()
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
    private playersService: PlayersService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.setPlayerDestroyHandler();
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
    if (this.player.isCrashed) {
      return;
    }

    if (this.player.isCrashing) {
      this.cameraMode = CameraModesEnum.FOLLOW;
      this.handlePlaneCrashing(event.object, event.state.delta);
      this.focusCameraOnPlayer(event.object);
      return;
    }

    this.movePlane(event.object, event.state.delta);
    this.focusCameraOnPlayer(event.object);
  }

  getMaterial(model: Object3D) {
    return (model.children[0].children[0] as Mesh).material as MeshStandardMaterial;
  }

  private handlePlaneCrashing(plane: Object3D, delta: number) {
    const deltaMultiplier = delta / (1 / 60);
    // Rotate
    plane.rotateY(degToRad(3 * deltaMultiplier));
    plane.rotateX(degToRad(0.5 * deltaMultiplier));

    // Move closer to origin
    const newPosition = plane.position.multiplyScalar(1 - 0.00015 * deltaMultiplier).clone();
    plane.position.set(newPosition.x, newPosition.y, newPosition.z);

    // decrease velocity and move forward
    this.player.lastPosition.velocity *= 1 - 0.01 * deltaMultiplier;
    plane.translateY(determineDisplacement(this.player.lastPosition.velocity, delta));

    if (calculateAltitudeFromPosition(newPosition) <= 0) {
      this.player.endCrashingPlane();
    }
  }

  private movePlane(plane: Object3D, delta: number) {
    if (this.player.lastPosition.velocity) {
      const positionCopy = plane.position.clone();

      // Move forward by displacement and rotate downward to continue nosing down with curvature of earth
      const displacement = determineDisplacement(this.player.lastPosition.velocity, delta); // delta in s convert to h
      plane.rotateX(degToRad((displacement / CONFIG.FLIGHT_MOVING_CIRCUMFERENCE) * 360));
      plane.translateY(displacement);

      // Update targets by current movement
      this.updateByDifference(this.targetPosition!, positionCopy, plane.position, 1, 0.0000000001);
    }

    // Update position up to target gradually
    this.updateByDifference(plane.position, plane.position, this.targetPosition!, 0.1);
  }

  private focusCameraOnPlayer(plane: Object3D) {
    if (this.player.isFocused && this.cameraMode !== CameraModesEnum.FREE && this.camera) {
      const position = plane.position.clone().multiplyScalar(CONFIG.CAMERA_FOLLOWING_HEIGHT_MULTIPLIER);
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
    if (this.isDifferenceNegligibleOrHuge(start, end, accuracy)) {
      ['x', 'y', 'z'].forEach(direction => {
        target[direction as 'x' | 'y' | 'z'] = end[direction as 'x' | 'y' | 'z'];
      });
      return;
    }
    ['x', 'y', 'z'].forEach(direction => {
      this.updateDirectionByDifference(direction as 'x' | 'y' | 'z', target, start, end, multiplier);
    });
  }

  private isDifferenceNegligibleOrHuge<T extends Euler | Vector3>(start: T, end: T, accuracy: number) {
    return ['x', 'y', 'z'].every((directionValue: string) => {
      const difference = Math.abs(end[directionValue as 'x' | 'y' | 'z'] - start[directionValue as 'x' | 'y' | 'z']);
      return difference < accuracy || difference > 5;
    });
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

  private setPlayerDestroyHandler() {
    // To quickly remove plane from scene when dead or disconnected
    this.player.destroy$.pipe(untilDestroyed(this)).subscribe(() => this.cdr.detectChanges());
  }
}
