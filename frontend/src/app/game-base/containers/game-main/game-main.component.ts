import { Component, OnDestroy } from '@angular/core';
import { NgtCameraOptions, NgtGLOptions } from '@angular-three/core/lib/types';
import { PCFSoftShadowMap, WebGLShadowMap } from 'three';
import { PlaneState } from '../../utils/models/game.types';
import { DEFAULT_PLANE_STATE, DIRECTION, SPEED } from '../../utils/models/game.constants';
import { auditTime, filter, fromEvent, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'pg-game-main',
  templateUrl: './game-main.component.html',
  styleUrls: ['./game-main.component.scss'],
})
export class GameMainComponent implements OnDestroy {
  readonly cameraOptions: NgtCameraOptions = {
    zoom: 1,
    position: [0, 15, 50],
  };
  readonly rendererOptions: NgtGLOptions = {
    physicallyCorrectLights: true,
  };
  readonly shadowOptions: Partial<WebGLShadowMap> = {
    enabled: true,
    type: PCFSoftShadowMap,
  };

  myPlaneState: PlaneState = DEFAULT_PLANE_STATE;

  private destroy$ = new Subject<void>();
  private keyDownEvent$ = fromEvent<KeyboardEvent>(document, 'keydown').pipe(takeUntil(this.destroy$));

  constructor() {
    this.setupDirectionChangeHandling();
    this.setupSpeedChangeHandling();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupDirectionChangeHandling() {
    this.keyDownEvent$
      .pipe(
        filter(e => e.key === 'ArrowLeft'),
        auditTime(100)
      )
      .subscribe(() => {
        this.myPlaneState.direction -= DIRECTION.step;
        if (this.myPlaneState.direction < DIRECTION.min) {
          this.myPlaneState.direction += DIRECTION.max;
        }
      });
    this.keyDownEvent$
      .pipe(
        filter(e => e.key === 'ArrowRight'),
        auditTime(100)
      )
      .subscribe(() => {
        this.myPlaneState.direction += DIRECTION.step;
        this.myPlaneState.direction %= DIRECTION.max;
      });
  }

  private setupSpeedChangeHandling() {
    this.keyDownEvent$
      .pipe(
        filter(e => e.key === 'ArrowUp'),
        auditTime(100)
      )
      .subscribe(() => {
        if (this.myPlaneState.speed + SPEED.step <= SPEED.max) {
          this.myPlaneState.speed += SPEED.step;
        }
      });
    this.keyDownEvent$
      .pipe(
        filter(e => e.key === 'ArrowDown'),
        auditTime(100)
      )
      .subscribe(() => {
        if (this.myPlaneState.speed - SPEED.step >= SPEED.min) {
          this.myPlaneState.speed -= SPEED.step;
        }
      });
  }
}
