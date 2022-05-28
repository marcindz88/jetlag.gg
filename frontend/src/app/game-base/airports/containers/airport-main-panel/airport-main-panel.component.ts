import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Airport } from '@pg/game-base/airports/models/airport';
import { Shipment } from '@pg/game-base/airports/models/airport.types';
import { AirportsService } from '@pg/game-base/airports/services/airports.service';
import { KeyEventEnum } from '@pg/game-base/models/keyboard.types';
import { KeyboardControlsService } from '@pg/game-base/services/keyboard-controls.service';

@UntilDestroy()
@Component({
  selector: 'pg-airport-main-panel',
  templateUrl: './airport-main-panel.component.html',
  styleUrls: ['airport-main-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AirportMainPanelComponent implements OnInit {
  @Input() airport!: Airport;
  @Input() carriedPackageId: string | null = null;

  selectedIndex = 0;
  firstPackageIndex = 0;

  constructor(
    private keyboardControlsService: KeyboardControlsService,
    private airportsService: AirportsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.setKeyboardControls();
    this.setAirportUpdater();
  }

  trackById(index: number, object: Shipment) {
    return object.id;
  }

  startDepartureProcedure() {
    this.airportsService.requestDeparturePermission(this.airport.id);
  }

  requestShipment() {
    this.airportsService.requestShipmentDispatch(this.airport.shipments[this.selectedIndex].id);
  }

  startFuelingProcedure() {
    console.log('TODO fueling procedure');
  }

  goToNextPackage() {
    if (this.selectedIndex + 1 === this.airport.shipments.length) {
      this.selectedIndex = 0;
      this.firstPackageIndex = 0;
    } else {
      this.selectedIndex++;
      if (this.selectedIndex > 2 && this.firstPackageIndex < this.airport.shipments.length - 3) {
        this.firstPackageIndex++;
      }
    }
    this.cdr.markForCheck();
  }

  goToPreviousPackage() {
    if (this.selectedIndex === 0) {
      this.selectedIndex = this.airport.shipments.length - 1;
      this.firstPackageIndex = Math.max(this.airport.shipments.length - 3, 0);
    } else {
      this.selectedIndex--;
      if (this.firstPackageIndex && this.selectedIndex < 3) {
        this.firstPackageIndex--;
      }
    }
    this.cdr.markForCheck();
  }

  private setKeyboardControls() {
    this.keyboardControlsService.setupKeyEvent(KeyEventEnum.RIGHT, this, this.goToNextPackage.bind(this));
    this.keyboardControlsService.setupKeyEvent(KeyEventEnum.LEFT, this, this.goToPreviousPackage.bind(this));
    this.keyboardControlsService.setupKeyEvent(KeyEventEnum.TAKE_OFF, this, this.startDepartureProcedure.bind(this));
    this.keyboardControlsService.setupKeyEvent(KeyEventEnum.SELECT, this, this.requestShipment.bind(this));
  }

  private setAirportUpdater() {
    this.airport.changed$.pipe(untilDestroyed(this)).subscribe(() => this.cdr.markForCheck());
  }
}
