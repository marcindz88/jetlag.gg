import { Injectable } from '@angular/core';
import { GameWebsocketService } from '@pg/game/services/game-websocket.service';
import { PlayersService } from '@pg/game/services/players.service';
import { ClientMessageTypeEnum, ServerMessageTypeEnum } from '@shared/models/wss.types';
import { ClockService } from '@shared/services/clock.service';
import { NotificationService } from '@shared/services/notification.service';
import { ReplaySubject, Subject, takeUntil } from 'rxjs';

import { Airport } from '../models/airport';
import { AirportList, AirportUpdate, Shipment } from '../models/airport.types';

@Injectable()
export class AirportsService {
  airports = new Map<string, Airport>();
  listChanged$ = new ReplaySubject<void>();
  updated$ = new ReplaySubject<void>();
  refuellingStopped$ = new Subject<void>();
  reset$ = new Subject<void>();

  constructor(
    private mainWebsocketService: GameWebsocketService,
    private clockService: ClockService,
    private playersService: PlayersService,
    private notificationService: NotificationService
  ) {}

  resetAll() {
    this.airports.clear();
    this.reset$.next();
  }

  setAirportsUpdateHandler() {
    this.mainWebsocketService.airportMessages$.pipe(takeUntil(this.reset$)).subscribe(airportMessage => {
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
        case ServerMessageTypeEnum.AIRPORT_REFUELLING_STOPPED:
          this.refuellingStopped$.next();
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
    this.notificationService.openNotification({
      text: `Successfully delivered ${shipment.name} for ${shipment.award}$`,
      icon: 'redeem',
    });
  }
}
