import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  defaultLoadingButtonConfig,
  LoadingButtonConfig,
} from '@shared/components/loading-button/loading-button.types';
import { finalize, takeWhile, timer } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'pg-loading-button',
  templateUrl: './loading-button.component.html',
  styleUrls: ['./loading-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingButtonComponent {
  @Input() disabled = false;

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

  startElapsing() {
    if (!this.disabled && this.elapsedTime < this.config.totalTime) {
      this.isElapsing = true;

      timer(0, this.step)
        .pipe(
          takeWhile(() => this.elapsedTime < this.config.totalTime),
          untilDestroyed(this),
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
          }

          this.cdr.markForCheck();
        });
    }
  }
}
