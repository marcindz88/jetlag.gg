import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NearAirport } from '@pg/game-base/airports/models/airport.types';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[pg-airport-info]',
  templateUrl: './airport-info.component.html',
  styleUrls: ['./airport-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AirportInfoComponent {
  @Input() nearAirport!: NearAirport;
}
