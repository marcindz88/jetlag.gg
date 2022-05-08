import { OtherPlayer } from '../../players/models/player.types';

export type Message = {
  type: ServerMessageTypeEnum;
  created: number;
  data: OtherPlayer;
  emitted_by_server: boolean;
};

export enum ServerMessageTypeEnum {
  CONNECTED = 'player.connected',
  REGISTERED = 'player.registered',
  DISCONNECTED = 'player.disconnected',
  REMOVED = 'player.removed',
}
