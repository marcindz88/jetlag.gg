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
  @Input() playerShipment: Shipment | null = null;

  selectedId: string | null = null;
  focusedId: string | null = null;
  firstPackageIndex = 0;

  constructor(
    private keyboardControlsService: KeyboardControlsService,
    private airportsService: AirportsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.returnPackage();
    this.resetFocusedId();
    this.setKeyboardControls();
    this.setAirportUpdater();
  }

  trackById(index: number, object: Shipment) {
    return object.id;
  }

  startDepartureProcedure() {
    if (this.selectedId) {
      this.airportsService.requestShipmentDispatch(this.selectedId);
    }
    this.airportsService.requestDeparturePermission(this.airport.id);
  }

  startFuelingProcedure() {
    console.log('TODO fueling procedure');
  }

  goToNextPackage() {
    let focusedIndex = this.getIndexOfFocusedPackage();
    if (focusedIndex + 1 === this.airport.shipments.length) {
      this.focusedId = this.getPackageId(0);
      this.firstPackageIndex = 0;
    } else {
      this.focusedId = this.getPackageId(++focusedIndex);
      if (focusedIndex > 2 && this.firstPackageIndex < this.airport.shipments.length - 3) {
        this.firstPackageIndex++;
      }
    }
    this.cdr.markForCheck();
  }

  goToPreviousPackage() {
    let focusedIndex = this.getIndexOfFocusedPackage();
    if (focusedIndex === 0) {
      this.focusedId = this.getPackageId(this.airport.shipments.length - 1);
      this.firstPackageIndex = Math.max(this.airport.shipments.length - 3, 0);
    } else {
      this.focusedId = this.getPackageId(--focusedIndex);
      if (this.firstPackageIndex && focusedIndex < 3) {
        this.firstPackageIndex--;
      }
    }
    this.cdr.markForCheck();
  }

  focusPackage(id: string) {
    this.focusedId = id;
  }

  selectOrDeselectPackage(id: string | null) {
    if (!id || this.selectedId === id || this.playerShipment) {
      this.selectedId = null;
    } else {
      this.selectedId = id;
    }
  }

  private returnPackage() {
    if (this.playerShipment && this.playerShipment.destination_id === this.airport.id) {
      this.airportsService.requestShipmentDelivery();
    }
  }

  private getPackageId(index: number): string | null {
    return this.airport.shipments[index]?.id || null;
  }

  private getIndexOfFocusedPackage() {
    return this.focusedId ? this.airport.shipments.findIndex(shipment => shipment.id === this.focusedId) : -1;
  }

  private setKeyboardControls() {
    this.keyboardControlsService.setupKeyEvent(KeyEventEnum.RIGHT, this, this.goToNextPackage.bind(this));
    this.keyboardControlsService.setupKeyEvent(KeyEventEnum.LEFT, this, this.goToPreviousPackage.bind(this));
    this.keyboardControlsService.setupKeyEvent(KeyEventEnum.TAKE_OFF, this, this.startDepartureProcedure.bind(this));
    this.keyboardControlsService.setupKeyEvent(KeyEventEnum.ENTER, this, () => {
      this.selectOrDeselectPackage(this.focusedId);
      this.cdr.markForCheck();
    });
  }

  private setAirportUpdater() {
    this.airport.changed$.pipe(untilDestroyed(this)).subscribe(() => {
      if (this.getIndexOfFocusedPackage() === -1) {
        this.resetFocusedId();
      }
      this.cdr.markForCheck();
    });
  }

  private resetFocusedId() {
    this.focusedId = this.getPackageId(0) || null;
    this.firstPackageIndex = 0;
  }
}
