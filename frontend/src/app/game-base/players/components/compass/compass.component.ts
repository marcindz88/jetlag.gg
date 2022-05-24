import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { normalizeBearing } from '@pg/game-base/utils/geo-utils';

@Component({
  selector: 'pg-compass',
  templateUrl: './compass.component.html',
  styleUrls: ['./compass.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompassComponent {
  readonly directions = ['N', 'E', 'S', 'W'];

  @Input() set bearing(bearing: number) {
    if (!this._bearing) {
      this._bearing = bearing;
      return;
    }
    const difference = normalizeBearing(this._bearing % 360) - bearing;

    // 359 - 0
    if (difference > 180) {
      this._bearing -= difference - 360;
      return;
    }
    // 0 - 359
    if (difference < -180) {
      this._bearing -= difference + 360;
      return;
    }

    this._bearing -= difference;
  }

  _bearing: number | null = null;
}
