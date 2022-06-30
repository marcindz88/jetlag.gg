import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  defaultLoadingButtonConfig,
  LoadingButtonConfig,
} from '@shared/components/loading-button/loading-button.types';
import { ClockService } from '@shared/services/clock.service';
import { finalize, fromEvent, Subject, takeUntil, takeWhile, timer } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'pg-loading-button',
  templateUrl: './loading-button.component.html',
  styleUrls: ['./loading-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingButtonComponent implements OnInit {
  @Output() started = new EventEmitter<void>();
  @Output() finished = new EventEmitter<void>();

  @Input() disabled = false;
  @Input() externalToggle$ = new Subject<void>();
  @Input() stop$ = new Subject<void>();

  @Input() set config(config: Partial<LoadingButtonConfig>) {
    this.#config = { ...this.#config, ...config };
    this.elapsedTime = this.calculateInitialElapsedTime();
    this.currentProgress = this.calculateCurrentProgress();
    this.step = this.config.totalTime / 100;
  }

  get config(): LoadingButtonConfig {
    return this.#config;
  }

  elapsedTime = 0;
  startTime?: number;
  currentProgress = 0;
  step = 1;
  isElapsing = false;
  windowFocus$ = fromEvent(window, 'focus');

  #config: LoadingButtonConfig = defaultLoadingButtonConfig;

  constructor(private cdr: ChangeDetectorRef, private clockService: ClockService) {}

  ngOnInit(): void {
    this.externalToggle$.pipe(untilDestroyed(this)).subscribe(this.toggleLoading.bind(this));
    this.handleRefocus();
  }

  toggleLoading() {
    if (this.isElapsing) {
      this.isElapsing = false;
      this.cdr.markForCheck();
      return;
    }
    if (!this.disabled && this.elapsedTime < this.config.totalTime) {
      this.started.emit();
      this.isElapsing = true;
      this.startTime = this.clockService.getCurrentTime();

      timer(0, this.step)
        .pipe(
          takeWhile(() => this.elapsedTime < this.config.totalTime),
          untilDestroyed(this),
          takeWhile(() => this.isElapsing),
          takeUntil(this.stop$),
          finalize(() => {
            this.isElapsing = false;
            this.finished.emit();
            this.cdr.markForCheck();
          })
        )
        .subscribe(() => {
          this.elapsedTime += this.step;
          this.currentProgress++;

          if (this.elapsedTime >= this.config.totalTime) {
            this.elapsedTime = this.config.totalTime;
            this.currentProgress = 100;
            this.isElapsing = false;
          }

          this.cdr.markForCheck();
        });
    }
  }

  private handleRefocus() {
    this.windowFocus$.pipe(untilDestroyed(this)).subscribe(() => {
      if (this.startTime) {
        this.elapsedTime =
          this.calculateInitialElapsedTime() + (this.clockService.getCurrentTime() - this.startTime) / 1000;
        this.currentProgress = this.calculateCurrentProgress();
      }
    });
  }

  private calculateCurrentProgress(): number {
    return (this.elapsedTime / this.config.totalTime) * 100;
  }

  private calculateInitialElapsedTime(): number {
    return this.config.initialProgress
      ? this.config.initialProgress * this.config.totalTime
      : this.config.initialElapsedTime;
  }
}
