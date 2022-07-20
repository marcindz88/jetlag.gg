import { Injectable } from '@angular/core';
import { AirportList, AirportUpdate, Shipment } from '@pg/game/models/airport.types';
import { OtherPlayer, PlayerList, PlayerPositionUpdate } from '@pg/game/models/player.types';
import { ClientMessageTypeEnum, MainMessage, MessageDataType, ServerMessageTypeEnum } from '@shared/models/wss.types';
import { AbstractWebsocketService } from '@shared/services/abstract-websocket.service';
import { Subject } from 'rxjs';

@Injectable()
export class GameWebsocketService extends AbstractWebsocketService<
  MainMessage,
  MainMessage<MessageDataType, ClientMessageTypeEnum>
> {
  airportMessages$: Subject<MainMessage<AirportList | AirportUpdate | Shipment>> = new Subject();
  playerMessages$: Subject<MainMessage<PlayerList | OtherPlayer>> = new Subject();
  playerPositionMessages$: Subject<MainMessage<PlayerPositionUpdate>> = new Subject();

  protected override reconnectTime = 10000;

  get class(): { name: string } {
    return GameWebsocketService;
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
