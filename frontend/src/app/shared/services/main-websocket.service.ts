import { Injectable } from '@angular/core';
import { AirportList, AirportUpdate } from '@pg/game-base/airports/models/airport.types';
import { OtherPlayer, PlayerList, PlayerPositionUpdate } from '@pg/game-base/players/models/player.types';
import { ClientMessageTypeEnum, MainMessage, MessageDataType, ServerMessageTypeEnum } from '@shared/models/wss.types';
import { AbstractWebsocketService } from '@shared/services/abstract-websocket.service';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MainWebsocketService extends AbstractWebsocketService<
  MainMessage,
  MainMessage<MessageDataType, ClientMessageTypeEnum>
> {
  airportMessages$: Subject<MainMessage<AirportList | AirportUpdate>> = new Subject();
  playerMessages$: Subject<MainMessage<PlayerList | OtherPlayer>> = new Subject();
  playerPositionMessages$: Subject<MainMessage<PlayerPositionUpdate>> = new Subject();

  get class(): { name: string } {
    return MainWebsocketService;
  }

  setupGameWebsocket(token: string) {
    this.createWSSConnection(token);
  }

  messagesHandler(message: MainMessage<MessageDataType, ServerMessageTypeEnum | ClientMessageTypeEnum>): void {
    if (message.type.startsWith('player_position')) {
      this.playerPositionMessages$.next(message as MainMessage<PlayerPositionUpdate>);
      return;
    }
    if (message.type.startsWith('player')) {
      this.playerMessages$.next(message as MainMessage<OtherPlayer>);
      return;
    }
    if (message.type.startsWith('airport')) {
      this.airportMessages$.next(message as MainMessage<AirportList | AirportUpdate>);
      return;
    }
  }
}
