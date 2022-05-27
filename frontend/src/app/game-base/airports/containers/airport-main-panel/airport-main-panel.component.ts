import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Airport } from '@pg/game-base/airports/models/airport';
import { Shipment } from '@pg/game-base/airports/models/airport.types';

@UntilDestroy()
@Component({
  selector: 'pg-airport-main-panel',
  templateUrl: './airport-main-panel.component.html',
  styleUrls: ['airport-main-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AirportMainPanelComponent {
  @Input() airport!: Airport;
  @Output() departureClicked = new EventEmitter<void>();

  trackById(index: number, object: Shipment) {
    return object.id;
  }
}
