import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ServerMessageTypeEnum } from '@shared/models/wss.types';
import { MainWebsocketService } from '@shared/services/main-websocket.service';
import { ReplaySubject } from 'rxjs';

import { Airport } from '../models/airport';
import { AirportList, AirportUpdate } from '../models/airport.types';

@UntilDestroy()
@Injectable({ providedIn: 'root' })
export class AirportsService {
  airports = new Map<string, Airport>();
  changed$ = new ReplaySubject<void>();

  constructor(private mainWebsocketService: MainWebsocketService) {}

  setAirportsUpdateHandler() {
    this.mainWebsocketService.airportMessages$.pipe(untilDestroyed(this)).subscribe(airportMessage => {
      switch (airportMessage.type) {
        case ServerMessageTypeEnum.AIRPORT_LIST:
          this.saveAirportList(airportMessage.data as AirportList);
          break;
        case ServerMessageTypeEnum.AIRPORT_PLANE_LANDED:
          this.updateAirport(airportMessage.data as AirportUpdate);
          break;
      }
      this.changed$.next();
    });
  }

  private saveAirportList(airportList: AirportList) {
    airportList.airports.forEach(airport => this.airports.set(airport.id, new Airport(airport)));
  }

  private updateAirport(airportUpdate: AirportUpdate) {
    this.airports.get(airportUpdate.id)?.updateAirport(airportUpdate);
  }
}
