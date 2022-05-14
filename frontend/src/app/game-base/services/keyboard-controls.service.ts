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
    this.handleKeyEvent(KeyEventEnum.FORWARD, 'w', 'ArrowUp', 'Up');
    this.handleKeyEvent(KeyEventEnum.LEFT, 'a', 'ArrowLeft', 'Left');
    this.handleKeyEvent(KeyEventEnum.RIGHT, 'd', 'ArrowRight', 'Right');
    this.handleKeyEvent(KeyEventEnum.BACKWARD, 's', 'ArrowDown', 'Down');
    this.handleKeyEvent(KeyEventEnum.CAMERA, 'c');
  }

  setupKeyEvent<T>(type: KeyEventEnum, destroyBase: T, handleFunction: () => void) {
    this.keyEvent$
      .pipe(
        filter(event => event == type),
        untilDestroyed(destroyBase)
      )
      .subscribe(handleFunction);
  }

  private handleKeyEvent(type: KeyEventEnum, ...keyCodes: string[]) {
    this.keyDownEvent$
      .pipe(
        filter(event => keyCodes.includes(event.key)),
        take(1),
        switchMap(keyEvent =>
          timer(0, 200).pipe(takeUntil(this.keyUpEvent$.pipe(filter(event => event.key === keyEvent.key))))
        ),
        repeat()
      )
      .subscribe(() => this.keyEvent$.next(type));
  }
}
