import { AirportList, AirportRequest, AirportUpdate, Shipment } from '@pg/game/models/airport.types';
import { PlaneStateUpdateRequest } from '@pg/game/models/game.types';
import { OtherPlayer, PlayerList, PlayerPositionUpdate } from '@pg/game/models/player.types';

export type MessageDataType =
  | OtherPlayer
  | PlayerList
  | PlaneStateUpdateRequest
  | PlayerPositionUpdate
  | AirportList
  | AirportUpdate
  | AirportRequest
  | Shipment
  | Record<string, never>;

export type MessageTypeEnum = ServerMessageTypeEnum | ClientMessageTypeEnum;

export type ClockClientMessage = number;

export type ClockServerMessage = { t: number; ref: number };

export type WSSConfigServerMessage = { config: WSSConfig };

export type ServerMessage = MainMessage | ClockServerMessage | WSSConfigServerMessage;

export type ClientMessage = MainMessage<MessageDataType, ClientMessageTypeEnum> | ClockClientMessage;

export type MainMessage<
  T extends MessageDataType = MessageDataType,
  K extends MessageTypeEnum = ServerMessageTypeEnum
> = {
  type: K;
  data: T;
  created: number;
};

export type WSSConfig = {
  max_pong_awaiting_time: number | null;
  ping_interval: number | null;
};

export enum ServerMessageTypeEnum {
  PLAYER_LIST = 'player.list',
  PLAYER_CONNECTED = 'player.connected',
  PLAYER_REGISTERED = 'player.registered',
  PLAYER_DISCONNECTED = 'player.disconnected',
  PLAYER_UPDATED = 'player.updated',
  PLAYER_REMOVED = 'player.removed',
  PLAYER_POSITION_UPDATED = 'player_position.updated',
  AIRPORT_LIST = 'airport.list',
  AIRPORT_UPDATED = 'airport.updated',
  AIRPORT_SHIPMENT_DELIVERED = 'airport.shipment_delivered',
  AIRPORT_REFUELLING_STOPPED = 'airport.refueling_stopped',
}

export enum ClientMessageTypeEnum {
  PLAYER_POSITION_UPDATE_REQUEST = 'player_position.update_request',
  AIRPORT_LANDING_REQUEST = 'airport.landing_request',
  AIRPORT_DEPARTURE_REQUEST = 'airport.departure_request',
  AIRPORT_SHIPMENT_DISPATCH_REQUEST = 'airport.shipment_dispatch_request',
  AIRPORT_SHIPMENT_DELIVERY_REQUEST = 'airport.shipment_delivery_request',
  AIRPORT_REFUELLING_START_REQUEST = 'airport.refueling_start_request',
  AIRPORT_REFUELLING_END_REQUEST = 'airport.refueling_end_request',
}
