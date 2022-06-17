import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter, fromEvent, merge, repeat, Subject, switchMap, take, takeUntil, tap, timer } from 'rxjs';

import { KeyEventEnum } from '../models/keyboard.types';

@UntilDestroy()
@Injectable()
export class KeyboardControlsService {
  keyEvent$ = new Subject<KeyEventEnum>();

  private windowBlurEvent$ = fromEvent(window, 'blur').pipe(untilDestroyed(this)).pipe(tap(console.log));
  private keyDownEvent$ = fromEvent<KeyboardEvent>(document, 'keydown').pipe(untilDestroyed(this));
  private keyUpEvent$ = fromEvent<KeyboardEvent>(document, 'keyup').pipe(untilDestroyed(this));

  constructor() {
    // Quick events
    this.handleKeyEvent(KeyEventEnum.FORWARD, ['w', 'W', 'ArrowUp', 'Up'], 200);
    this.handleKeyEvent(KeyEventEnum.BACKWARD, ['s', 'S', 'ArrowDown', 'Down'], 200);
    this.handleKeyEvent(KeyEventEnum.TURN_LEFT, ['a', 'A', 'ArrowLeft', 'Left'], 100);
    this.handleKeyEvent(KeyEventEnum.TURN_RIGHT, ['d', 'D', 'ArrowRight', 'Right'], 100);

    // Ordinary slow events
    this.handleKeyEvent(KeyEventEnum.PLAYER_FOCUS_PREV, ['<', ',']);
    this.handleKeyEvent(KeyEventEnum.PLAYER_FOCUS_NEXT, ['>', '.']);
    this.handleKeyEvent(KeyEventEnum.PLAYER_SELF_FOCUS, ['m', 'M']);
    this.handleKeyEvent(KeyEventEnum.CAMERA, ['c', 'C']);
    this.handleKeyEvent(KeyEventEnum.LAND_OR_TAKE_OFF, ['f', 'F']);
    this.handleKeyEvent(KeyEventEnum.ENTER, ['Enter']);
    this.handleKeyEvent(KeyEventEnum.FUEL, ['x', 'X']);
    this.handleKeyEvent(KeyEventEnum.HELP, ['h', 'H']);
    this.handleKeyEvent(KeyEventEnum.LEFT, ['a', 'A', 'ArrowLeft', 'Left']);
    this.handleKeyEvent(KeyEventEnum.RIGHT, ['d', 'D', 'ArrowRight', 'Right']);
  }

  setupKeyEvent<T>(type: KeyEventEnum, destroyBase: T, handleFunction: () => void) {
    this.keyEvent$
      .pipe(
        filter(event => event == type),
        untilDestroyed(destroyBase)
      )
      .subscribe(handleFunction);
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
}
