import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filterByTouchId, mapToTouch } from '@pg/game/utils/touch-utils';
import { Logger } from '@shared/services/logger.service';
import { filter, fromEvent, merge, repeat, Subject, switchMap, take, takeUntil, timer } from 'rxjs';

import { KeyEventEnum, touchEventMapper } from '../models/keyboard-events.types';

@UntilDestroy()
@Injectable()
export class KeyboardAndTouchControlsService {
  private keyEvent$ = new Subject<KeyEventEnum>();

  private windowBlurEvent$ = fromEvent(window, 'blur').pipe(untilDestroyed(this));
  private keyDownEvent$ = fromEvent<KeyboardEvent>(document, 'keydown').pipe(untilDestroyed(this));
  private keyUpEvent$ = fromEvent<KeyboardEvent>(document, 'keyup').pipe(untilDestroyed(this));

  private touchStartEvent$ = fromEvent<TouchEvent>(document, 'touchstart').pipe(untilDestroyed(this));
  private touchEndEvent$ = fromEvent<TouchEvent>(document, 'touchend').pipe(untilDestroyed(this));
  private touchCancelEvent$ = fromEvent<TouchEvent>(document, 'touchcancel').pipe(untilDestroyed(this));
  private touchMoveEvent$ = fromEvent<TouchEvent>(document, 'touchmove').pipe(untilDestroyed(this));

  constructor() {
    // Quick events
    this.handleKeyEvent(KeyEventEnum.FORWARD, ['w', 'W', 'ArrowUp', 'Up'], 200);
    this.handleKeyEvent(KeyEventEnum.BACKWARD, ['s', 'S', 'ArrowDown', 'Down'], 200);
    this.handleKeyEvent(KeyEventEnum.TURN_LEFT, ['a', 'A', 'ArrowLeft', 'Left'], 200);
    this.handleKeyEvent(KeyEventEnum.TURN_RIGHT, ['d', 'D', 'ArrowRight', 'Right'], 200);

    // Ordinary slow events
    this.handleKeyEvent(KeyEventEnum.PLAYER_FOCUS_PREV, ['<', ',']);
    this.handleKeyEvent(KeyEventEnum.PLAYER_FOCUS_NEXT, ['>', '.']);
    this.handleKeyEvent(KeyEventEnum.PLAYER_SELF_FOCUS, ['m', 'M']);
    this.handleKeyEvent(KeyEventEnum.CAMERA, ['c', 'C']);
    this.handleKeyEvent(KeyEventEnum.LAND, ['f', 'F']);
    this.handleKeyEvent(KeyEventEnum.TAKE_OFF, ['f', 'F']);
    this.handleKeyEvent(KeyEventEnum.ENTER, ['Enter']);
    this.handleKeyEvent(KeyEventEnum.FUEL, ['x', 'X']);
    this.handleKeyEvent(KeyEventEnum.HELP, ['h', 'H']);
    this.handleKeyEvent(KeyEventEnum.LEFT, ['a', 'A', 'ArrowLeft', 'Left']);
    this.handleKeyEvent(KeyEventEnum.RIGHT, ['d', 'D', 'ArrowRight', 'Right']);

    // Touch events
    this.handleTouchEvents(KeyEventEnum.FORWARD, 200);
    this.handleTouchEvents(KeyEventEnum.BACKWARD, 200);
    this.handleTouchEvents(KeyEventEnum.TURN_LEFT, 200);
    this.handleTouchEvents(KeyEventEnum.TURN_RIGHT, 200);
    this.handleTouchEvents(KeyEventEnum.LAND);
  }

  setupKeyEvent<T>(type: KeyEventEnum, destroyBase: T, handleFunction: () => void) {
    this.keyEvent$
      .pipe(
        filter(event => event == type),
        untilDestroyed(destroyBase)
      )
      .subscribe(handleFunction);
  }

  simulateKeyPress(type: KeyEventEnum) {
    this.keyEvent$.next(type);
  }

  private handleKeyEvent(type: KeyEventEnum, keyCodes: string[], duration = 500) {
    this.keyDownEvent$
      .pipe(
        filter(event => keyCodes.includes(event.key)),
        take(1),
        switchMap(() =>
          timer(0, duration).pipe(
            takeUntil(
              merge(this.windowBlurEvent$, this.keyUpEvent$.pipe(filter(event => keyCodes.includes(event.key))))
            )
          )
        ),
        repeat()
      )
      .subscribe(() => this.keyEvent$.next(type));
  }

  private handleTouchEvents(type: KeyEventEnum, duration = 500) {
    const location = touchEventMapper[type];

    if (!location) {
      Logger.error(KeyboardAndTouchControlsService, 'This key event is not supported by touch screens');
      return;
    }

    // Allow only touches started correctly
    merge(this.touchStartEvent$, this.touchMoveEvent$)
      .pipe(
        // Continue only if matching touch location
        mapToTouch(location),
        filter(Boolean),
        // Take one (later repeated, when this handler finishes)
        take(1),
        switchMap(touch =>
          timer(0, duration).pipe(
            takeUntil(
              merge(
                this.windowBlurEvent$,
                this.touchEndEvent$.pipe(filterByTouchId(touch.identifier)),
                this.touchCancelEvent$.pipe(filterByTouchId(touch.identifier)),
                // End only if moved so that it is outside of required area
                this.touchMoveEvent$.pipe(
                  filterByTouchId(touch.identifier),
                  mapToTouch(location),
                  filter(touch => !touch)
                )
              )
            )
          )
        ),
        repeat()
      )
      .subscribe(() => this.keyEvent$.next(type));
  }
}
