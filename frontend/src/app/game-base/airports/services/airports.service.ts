import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ClientMessageTypeEnum, ServerMessageTypeEnum } from '@shared/models/wss.types';
import { ClockService } from '@shared/services/clock.service';
import { MainWebsocketService } from '@shared/services/main-websocket.service';
import { ReplaySubject } from 'rxjs';

import { Airport } from '../models/airport';
import { AirportList, AirportUpdate } from '../models/airport.types';

@UntilDestroy()
@Injectable({ providedIn: 'root' })
export class AirportsService {
  airports = new Map<string, Airport>();
  listChanged$ = new ReplaySubject<void>();
  updated$ = new ReplaySubject<void>();

  constructor(private mainWebsocketService: MainWebsocketService, private clockService: ClockService) {}

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
      }
      this.updated$.next();
    });
  }

  requestLandingPermission(airportId: string) {
    this.sendAirportRequest(airportId, ClientMessageTypeEnum.AIRPORT_LANDING_REQUEST);
  }

  requestDeparturePermission(airportId: string) {
    this.sendAirportRequest(airportId, ClientMessageTypeEnum.AIRPORT_DEPARTURE_REQUEST);
  }

  requestShipmentDispatch(shipmentId: string) {
    this.sendAirportRequest(shipmentId, ClientMessageTypeEnum.AIRPORT_SHIPMENT_DISPATCH_REQUEST);
  }

  private sendAirportRequest(
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
}
