import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Shipment } from '@pg/game-base/airports/models/airport.types';
import { AirportsService } from '@pg/game-base/airports/services/airports.service';

@UntilDestroy()
@Component({
  selector: 'pg-shipment-details',
  templateUrl: './shipment-details.component.html',
  styleUrls: ['shipment-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipmentDetailsComponent {
  @Input() set shipment(shipment: Shipment) {
    this._shipment = shipment;
    this.destination = this.airportsService.airports.get(shipment.destination_id)!.name;
  }
  get shipment() {
    return this._shipment;
  }

  @Input() isFocused = false;
  @Input() isSelected = false;
  @Input() isSelectable = true;

  @Output() selected = new EventEmitter();

  destination!: string;
  private _shipment!: Shipment;

  constructor(private airportsService: AirportsService) {}
}
