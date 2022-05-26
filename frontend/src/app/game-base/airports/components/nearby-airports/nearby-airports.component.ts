import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { NearAirportsList } from '@pg/game-base/airports/models/airport.types';
import { ReplaySubject } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'pg-nearby-airports',
  templateUrl: './nearby-airports.component.html',
  styleUrls: ['nearby-airports.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NearbyAirportsComponent {
  @Input() airportList: NearAirportsList = [];
  @Input() updateTrigger$!: ReplaySubject<void>;
}
