import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PlayersService } from '@pg/game-base/players/services/players.service';
import { NotificationComponent } from '@shared/components/notification/notification.component';
import { ClientMessageTypeEnum, ServerMessageTypeEnum } from '@shared/models/wss.types';
import { ClockService } from '@shared/services/clock.service';
import { MainWebsocketService } from '@shared/services/main-websocket.service';
import { ReplaySubject, take } from 'rxjs';

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

  requestShipmentDelivery(shipment: Shipment) {
    const previousScore = this.playersService.myPlayer?.score || 0;
    this.mainWebsocketService.sendWSSMessage({
      type: ClientMessageTypeEnum.AIRPORT_SHIPMENT_DELIVERY_REQUEST,
      created: this.clockService.getCurrentTime(),
      data: {},
    });
    this.playersService.changed$.pipe(take(1)).subscribe(() => {
      if (previousScore <= this.playersService.myPlayer!.score + shipment.award) {
        this.matSnackBar.openFromComponent(NotificationComponent, {
          data: { text: `You have successfully delivered ${shipment.name} for ${shipment.award}$`, icon: 'redeem' },
        });
      }
    });
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
