import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgtRenderState } from '@angular-three/core';
import { Player } from '@pg/players/models/player';
import { Group } from 'three';
import { degToRad } from 'three/src/math/MathUtils';

import { MAP_SCALE, MOVING_CIRCUMFERENCE } from '../../models/game.constants';
import { TextureModelsService } from '../../services/texture-models.service';

@Component({
  selector: 'pg-plane',
  templateUrl: './plane.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaneComponent {
  @Input() player!: Player;

  readonly textures$ = this.textureModelsService.planeTextures$;

  constructor(private textureModelsService: TextureModelsService) {}

  updatePlane(event: { state: NgtRenderState; object: Group }) {
    this.movePlaneForward(event.object, event.state.delta);
    this.player.cartesianPosition = event.object.position;
    this.player.cartesianRotation = event.object.rotation;
  }

  private movePlaneForward(plane: Group, delta: number) {
    const displacement = (this.player.velocity / 3600) * MAP_SCALE * delta; // delta in s convert to h
    // Move forward by displacement and rotate downward to continue nosing down with curvature of earth
    plane.rotateX(degToRad((displacement / MOVING_CIRCUMFERENCE) * 360));
    plane.translateY(displacement);
  }
}
