import { Pipe, PipeTransform } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ClockService } from '@shared/services/clock.service';
import { map, Observable, of, takeWhile, timer } from 'rxjs';

@UntilDestroy()
@Pipe({
  name: 'remainingTime',
})
export class RemainingTimePipe implements PipeTransform {
  constructor(private clockService: ClockService) {}

  transform(endTime: number): Observable<number | null> {
    const remainingMS = endTime - this.clockService.getCurrentTime();
    const remainingS = Math.floor(remainingMS / 1000);

    if (remainingS <= 0) {
      return of(null);
    }

    return timer(0, 1000).pipe(
      untilDestroyed(this),
      takeWhile(i => i <= remainingS),
      map(i => remainingS - i)
    );
  }
}
