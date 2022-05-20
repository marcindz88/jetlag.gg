import { ChangeDetectionStrategy, Component, Input, ViewChild } from '@angular/core';
import { NgtCamera } from '@angular-three/core';
import { NgtPrimitive } from '@angular-three/core/primitive';
import { BeforeRenderedObject } from '@pg/game-base/models/game.types';
import { Player } from '@pg/players/models/player';
import { map } from 'rxjs';
import { Object3D } from 'three';
import { degToRad } from 'three/src/math/MathUtils';

import { MAP_SCALE, MOVING_CIRCUMFERENCE } from '../../models/game.constants';
import { TextureModelsService } from '../../services/texture-models.service';

@Component({
  selector: 'pg-plane',
  templateUrl: './plane.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaneComponent {
  @ViewChild(NgtPrimitive) set plane(plane: NgtPrimitive) {
    this.player.planeObject = plane?.instanceValue;
  }

  @Input() camera?: NgtCamera;
  @Input() player!: Player;
  @Input() cameraFollowing = false;

  readonly textures$ = this.textureModelsService.planeTextures$.pipe(
    map(({ model, trail }) => ({ model: model.clone(true), trail }))
  );

  constructor(private textureModelsService: TextureModelsService) {}

  updatePlane(event: BeforeRenderedObject) {
    this.movePlaneForward(event.object, event.state.delta);
  }

  private movePlaneForward(plane: Object3D, delta: number) {
    const displacement = (this.player.velocity / 3600) * MAP_SCALE * delta; // delta in s convert to h
    // Move forward by displacement and rotate downward to continue nosing down with curvature of earth
    plane.rotateX(degToRad((displacement / MOVING_CIRCUMFERENCE) * 360));
    plane.translateY(displacement);

    // Move camera if focused
    if (this.cameraFollowing) {
      this.focusCameraOnPlayer(plane);
    }
  }

  private focusCameraOnPlayer(plane: Object3D) {
    if (this.camera) {
      const position = plane.position.clone().multiplyScalar(1.2);
      this.camera.position.set(position.x, position.y, position.z);
    }
  }
}
