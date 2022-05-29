import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter, fromEvent, repeat, Subject, switchMap, take, takeUntil, timer } from 'rxjs';

import { KeyEventEnum } from '../models/keyboard.types';

@UntilDestroy()
@Injectable()
export class KeyboardControlsService {
  keyEvent$ = new Subject<KeyEventEnum>();

  private keyDownEvent$ = fromEvent<KeyboardEvent>(document, 'keydown').pipe(untilDestroyed(this));
  private keyUpEvent$ = fromEvent<KeyboardEvent>(document, 'keyup').pipe(untilDestroyed(this));

  constructor() {
    this.handleKeyEvent(KeyEventEnum.FORWARD, ['w', 'W', 'ArrowUp', 'Up']);
    this.handleKeyEvent(KeyEventEnum.LEFT, ['a', 'A', 'ArrowLeft', 'Left'], 100);
    this.handleKeyEvent(KeyEventEnum.RIGHT, ['d', 'D', 'ArrowRight', 'Right'], 100);
    this.handleKeyEvent(KeyEventEnum.BACKWARD, ['s', 'S', 'ArrowDown', 'Down']);
    this.handleKeyEvent(KeyEventEnum.PLAYER_FOCUS, ['v', 'V']);
    this.handleKeyEvent(KeyEventEnum.CAMERA, ['c', 'C']);
    this.handleKeyEvent(KeyEventEnum.LAND_OR_TAKE_OFF, ['f', 'F']);
    this.handleKeyEvent(KeyEventEnum.ENTER, ['Enter']);
    this.handleKeyEvent(KeyEventEnum.FUEL, ['x', 'X']);
    this.handleKeyEvent(KeyEventEnum.HELP, ['h', 'H']);
  }

  setupKeyEvent<T>(type: KeyEventEnum, destroyBase: T, handleFunction: () => void) {
    this.keyEvent$
      .pipe(
        filter(event => event == type),
        untilDestroyed(destroyBase)
      )
      .subscribe(handleFunction);
  }

  private handleKeyEvent(type: KeyEventEnum, keyCodes: string[], duration = 200) {
    this.keyDownEvent$
      .pipe(
        filter(event => keyCodes.includes(event.key)),
        take(1),
        switchMap(keyEvent =>
          timer(0, duration).pipe(takeUntil(this.keyUpEvent$.pipe(filter(event => event.key === keyEvent.key))))
        ),
        repeat()
      )
      .subscribe(() => this.keyEvent$.next(type));
  }
}
