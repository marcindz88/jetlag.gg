import { Injectable, OnDestroy } from '@angular/core';
import { filter, fromEvent, repeat, Subject, switchMap, take, takeUntil, timer } from 'rxjs';
import { KeyEventEnum } from '../models/keyboard.types';

@Injectable()
export class KeyboardControlsService implements OnDestroy {
  keyEvent$ = new Subject<KeyEventEnum>();

  private destroy$ = new Subject<void>();
  private keyDownEvent$ = fromEvent<KeyboardEvent>(document, 'keydown').pipe(takeUntil(this.destroy$));
  private keyUpEvent$ = fromEvent<KeyboardEvent>(document, 'keyup').pipe(takeUntil(this.destroy$));

  constructor() {
    this.handleKeyEvent(KeyEventEnum.FORWARD, 'w', 'ArrowUp', 'Up');
    this.handleKeyEvent(KeyEventEnum.LEFT, 'a', 'ArrowLeft', 'Left');
    this.handleKeyEvent(KeyEventEnum.RIGHT, 'd', 'ArrowRight', 'Right');
    this.handleKeyEvent(KeyEventEnum.BACKWARD, 's', 'ArrowDown', 'Down');
  }

  handleKeyEvent(type: KeyEventEnum, ...keyCodes: string[]) {
    this.keyDownEvent$
      .pipe(
        filter(event => keyCodes.includes(event.key)),
        take(1),
        switchMap(keyEvent =>
          timer(0, 100).pipe(takeUntil(this.keyUpEvent$.pipe(filter(event => event.key === keyEvent.key))))
        ),
        repeat()
      )
      .subscribe(() => this.keyEvent$.next(type));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
