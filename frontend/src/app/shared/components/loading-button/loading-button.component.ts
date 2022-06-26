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
import { finalize, Subject, takeUntil, takeWhile, timer } from 'rxjs';

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
    this.elapsedTime = config.currentProgress
      ? config.currentProgress * this.config.totalTime
      : this.config.elapsedTime;
    this.currentProgress = (this.elapsedTime / this.config.totalTime) * 100;
    this.step = this.config.totalTime / 100;
  }

  get config(): LoadingButtonConfig {
    return this.#config;
  }

  elapsedTime = 0;
  currentProgress = 0;
  step = 1;
  isElapsing = false;

  #config: LoadingButtonConfig = defaultLoadingButtonConfig;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.externalToggle$.pipe(untilDestroyed(this)).subscribe(this.toggleLoading.bind(this));
  }

  toggleLoading() {
    if (this.isElapsing) {
      this.finished.emit();
      this.isElapsing = false;
      return;
    }
    if (!this.disabled && this.elapsedTime < this.config.totalTime) {
      this.started.emit();
      this.isElapsing = true;

      timer(0, this.step)
        .pipe(
          takeWhile(() => this.elapsedTime < this.config.totalTime),
          untilDestroyed(this),
          takeWhile(() => this.isElapsing),
          takeUntil(this.stop$),
          finalize(() => {
            this.isElapsing = false;
            this.cdr.markForCheck();
          })
        )
        .subscribe(() => {
          this.elapsedTime += this.step;
          this.currentProgress++;

          if (this.elapsedTime > this.config.totalTime) {
            this.elapsedTime = this.config.totalTime;
            this.currentProgress = 100;
            this.finished.emit();
          }

          this.cdr.markForCheck();
        });
    }
  }
}
