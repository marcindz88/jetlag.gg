import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'pg-compass',
  templateUrl: './compass.component.html',
  styleUrls: ['./compass.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompassComponent {
  readonly directions = ['N', 'E', 'S', 'W'];

  @Input() bearing = 0;
}
