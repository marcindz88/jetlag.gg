import { PlaneStateUpdateRequest } from '@pg/game-base/models/game.types';
import { OtherPlayer, PlayerPositionUpdate } from '@pg/players/models/player.types';

export type MessageDataType = OtherPlayer | PlaneStateUpdateRequest | PlayerPositionUpdate | Record<string, never>;

export type MessageTypeEnum = ServerMessageTypeEnum | ClientMessageTypeEnum;

export type ClockClientMessage = number;

export type ClockServerMessage = { t: number; ref: number };

export type ServerMessage = MainMessage | ClockServerMessage;

export type ClientMessage = MainMessage<MessageDataType, ClientMessageTypeEnum> | ClockClientMessage;

export type MainMessage<
  T extends MessageDataType = MessageDataType,
  K extends MessageTypeEnum = ServerMessageTypeEnum
> = {
  type: K;
  data: T;
  created: number;
};

export enum ServerMessageTypeEnum {
  CONNECTED = 'player.connected',
  REGISTERED = 'player.registered',
  DISCONNECTED = 'player.disconnected',
  REMOVED = 'player.removed',
  POSITION_UPDATED = 'player_position.updated',
}

export enum ClientMessageTypeEnum {
  POSITION_UPDATE_REQUEST = 'player_position.update_request',
}
