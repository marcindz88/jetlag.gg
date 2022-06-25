import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PlayersService } from '@pg/game-base/players/services/players.service';
import { NotificationComponent } from '@shared/components/notification/notification.component';
import { ClientMessageTypeEnum, ServerMessageTypeEnum } from '@shared/models/wss.types';
import { ClockService } from '@shared/services/clock.service';
import { MainWebsocketService } from '@shared/services/main-websocket.service';
import { ReplaySubject } from 'rxjs';

import { Airport } from '../models/airport';
import { AirportList, AirportUpdate, Shipment } from '../models/airport.types';

@UntilDestroy()
@Injectable({ providedIn: 'root' })
export class AirportsService {
  airports = new Map<string, Airport>();
  listChanged$ = new ReplaySubject<void>();
  updated$ = new ReplaySubject<void>();

  constructor(
    private mainWebsocketService: MainWebsocketService,
    private clockService: ClockService,
    private playersService: PlayersService,
    private matSnackBar: MatSnackBar
  ) {}

  setAirportsUpdateHandler() {
    this.mainWebsocketService.airportMessages$.pipe(untilDestroyed(this)).subscribe(airportMessage => {
      switch (airportMessage.type) {
        case ServerMessageTypeEnum.AIRPORT_LIST:
          this.saveAirportList(airportMessage.data as AirportList);
          this.listChanged$.next();
          break;
        case ServerMessageTypeEnum.AIRPORT_UPDATED:
          this.updateAirport(airportMessage.data as AirportUpdate);
          break;
        case ServerMessageTypeEnum.AIRPORT_SHIPMENT_DELIVERED:
          this.handlePackageDeliveredSnackbar(airportMessage.data as Shipment);
          break;
      }
      this.updated$.next();
    });
  }

  requestLandingPermission(airportId: string) {
    this.sendAirportRequestWithId(airportId, ClientMessageTypeEnum.AIRPORT_LANDING_REQUEST);
  }

  requestDeparturePermission(airportId: string) {
    this.sendAirportRequestWithId(airportId, ClientMessageTypeEnum.AIRPORT_DEPARTURE_REQUEST);
  }

  requestShipmentDispatch(shipmentId: string) {
    this.sendAirportRequestWithId(shipmentId, ClientMessageTypeEnum.AIRPORT_SHIPMENT_DISPATCH_REQUEST);
  }

  sendAirportRequest(
    type:
      | ClientMessageTypeEnum.AIRPORT_SHIPMENT_DELIVERY_REQUEST
      | ClientMessageTypeEnum.AIRPORT_REFUELLING_START_REQUEST
      | ClientMessageTypeEnum.AIRPORT_REFUELLING_END_REQUEST
  ) {
    this.mainWebsocketService.sendWSSMessage({
      type,
      created: this.clockService.getCurrentTime(),
      data: {},
    });
  }

  private sendAirportRequestWithId(
    id: string,
    type:
      | ClientMessageTypeEnum.AIRPORT_DEPARTURE_REQUEST
      | ClientMessageTypeEnum.AIRPORT_LANDING_REQUEST
      | ClientMessageTypeEnum.AIRPORT_SHIPMENT_DISPATCH_REQUEST
  ) {
    this.mainWebsocketService.sendWSSMessage({
      type,
      created: this.clockService.getCurrentTime(),
      data: { id },
    });
  }

  private saveAirportList(airportList: AirportList) {
    airportList.airports.forEach(airport => this.airports.set(airport.id, new Airport(airport)));
  }

  private updateAirport(airportUpdate: AirportUpdate) {
    this.airports.get(airportUpdate.id)?.updateAirport(airportUpdate);
  }

  private handlePackageDeliveredSnackbar(shipment: Shipment) {
    this.matSnackBar.openFromComponent(NotificationComponent, {
      data: { text: `You have successfully delivered ${shipment.name} for ${shipment.award}$`, icon: 'redeem' },
    });
  }
}
