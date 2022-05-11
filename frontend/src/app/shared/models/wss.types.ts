import { OtherPlayer } from '../../players/models/player.types';

export type ClockMessageDataType = { timestamp: number };

export type MessageDataType = OtherPlayer | ClockMessageDataType | Record<string, never>;
export type MessageTypeEnum = ServerMessageTypeEnum | ClientMessageTypeEnum;

export type Message<T extends MessageDataType = MessageDataType, K extends MessageTypeEnum = ServerMessageTypeEnum> = {
  type: K;
  data: T;
  created?: number;
};

export enum ServerMessageTypeEnum {
  CONNECTED = 'player.connected',
  REGISTERED = 'player.registered',
  DISCONNECTED = 'player.disconnected',
  REMOVED = 'player.removed',
  POSITION_UPDATED = 'player_position.updated',
  CLOCK_TIME = 'clock.time',
}

export enum ClientMessageTypeEnum {
  POSITION_UPDATE_REQUEST = 'player_position.update_request',
  CLOCK_SYNC = 'clock.sync',
}
