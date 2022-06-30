import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgtGroup } from '@angular-three/core/group';
import { NgtPrimitive } from '@angular-three/core/primitive';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BeforeRenderedObject } from '@pg/game-base/models/game.types';
import { CameraModesEnum } from '@pg/game-base/models/gane.enums';
import { Player } from '@pg/game-base/players/models/player';
import { PlayersService } from '@pg/game-base/players/services/players.service';
import { calculateAltitudeFromPosition } from '@pg/game-base/utils/geo-utils';
import { determineDisplacementAndRotation } from '@pg/game-base/utils/velocity-utils';
import { ClockService } from '@shared/services/clock.service';
import { CONFIG } from '@shared/services/config.service';
import { map, Observable } from 'rxjs';
import { Camera, Euler, Mesh, MeshStandardMaterial, Object3D, Quaternion, Vector3 } from 'three';
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
    if (plane) {
      this.player.perfectPlaneObject = plane?.instanceValue.clone();
    }
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

  readonly textures$: Observable<{ model: Object3D }>;
  readonly materials = this.textureModelsService.materials;

  private cameraFocused = false;
  private temps = {
    planeQuaternion: new Quaternion(),
    cameraQuaternionCopy: new Quaternion(),
    cameraQuaternionCopy2: new Quaternion(),
    cameraPositionCopy: new Vector3(),
    lastInitialPosition: new Vector3(),
    lastInitialRotation: new Euler(),
  };

  constructor(
    private textureModelsService: TextureModelsService,
    private clockService: ClockService,
    private playersService: PlayersService,
    private cdr: ChangeDetectorRef
  ) {
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

  ngOnInit() {
    this.setPlayerDestroyHandler();
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

    if (
      this.temps.lastInitialPosition !== this.player.initialPosition ||
      this.temps.lastInitialRotation !== this.player.initialRotation
    ) {
      this.handleInitialPlaneMove(event.object);
      return;
    }

    this.movePlane(event.object, event.state.delta);
    this.focusCameraOnPlayer(event.object);
  }

  getMaterial(model: Object3D) {
    return (model.children[0].children[0] as Mesh).material as MeshStandardMaterial;
  }

  private handleInitialPlaneMove(plane: Object3D) {
    plane.rotation.copy(this.player.initialRotation);
    plane.position.copy(this.player.initialPosition);

    this.temps.lastInitialRotation = this.player.initialRotation;
    this.temps.lastInitialPosition = this.player.initialPosition;
    this.cameraFocused = false;
  }

  private handlePlaneCrashing(plane: Object3D, delta: number) {
    const deltaMultiplier = delta / (1 / 60);
    // Rotate
    plane.rotateY(degToRad(3 * deltaMultiplier));
    plane.rotateX(degToRad(0.5 * deltaMultiplier));

    // Move closer to origin
    const newPosition = plane.position.multiplyScalar(1 - 0.00015 * deltaMultiplier).clone();
    plane.position.copy(newPosition);

    // decrease velocity and move forward
    this.player.lastPosition.velocity *= 1 - 0.01 * deltaMultiplier;
    const { displacement } = determineDisplacementAndRotation(this.player.lastPosition.velocity, delta);
    plane.translateY(displacement);

    if (calculateAltitudeFromPosition(newPosition) <= 0) {
      this.player.endCrashingPlane();
    }
  }

  private movePlane(plane: Object3D, delta: number) {
    // Update instantly if change bigger than 5 units
    if (this.player.perfectPlaneObject.position.distanceTo(plane.position) > 3) {
      plane.position.copy(this.player.perfectPlaneObject.position);
      plane.quaternion.copy(this.player.perfectPlaneObject.quaternion);
      return;
    }

    // Move forward by displacement and rotate downward to continue nosing down with curvature of earth
    if (this.player.lastPosition.velocity) {
      const { displacement, rotation } = determineDisplacementAndRotation(this.player.lastPosition.velocity, delta); // delta in s convert to h
      plane.rotateX(rotation);
      this.player.perfectPlaneObject.rotateX(rotation);
      plane.translateY(displacement);
      this.player.perfectPlaneObject.translateY(displacement);
    }

    // Update position up to target gradually
    plane.position.lerp(this.player.perfectPlaneObject.position, delta * 4);
    plane.quaternion.slerp(this.player.perfectPlaneObject.quaternion, 0.1);
  }

  private focusCameraOnPlayer(plane: Object3D) {
    if (this.player.isFocused && this.cameraMode !== CameraModesEnum.FREE && this.camera) {
      // SET position
      this.camera.position.copy(plane.position.clone().multiplyScalar(CONFIG.CAMERA_FOLLOWING_HEIGHT_MULTIPLIER));
      // SET rotation gradually using a copy that is looked at
      this.temps.cameraQuaternionCopy.copy(this.camera.quaternion);
      this.camera.lookAt(plane.position);
      if (this.cameraMode === CameraModesEnum.POSITION) {
        this.camera.rotation.z -= plane.rotation.z;
      }
      this.temps.cameraQuaternionCopy2.copy(this.camera.quaternion);
      this.camera.quaternion.copy(this.temps.cameraQuaternionCopy);
      // when player was not in focus move instantly to it
      this.camera.quaternion.slerp(this.temps.cameraQuaternionCopy2, this.cameraFocused ? 0.1 : 1);
      this.cameraFocused = true;
    }
  }

  private setPlayerDestroyHandler() {
    // To quickly remove plane from scene when dead or disconnected
    this.player.changeNotifiers.destroy$.pipe(untilDestroyed(this)).subscribe(() => this.cdr.detectChanges());
  }
}
