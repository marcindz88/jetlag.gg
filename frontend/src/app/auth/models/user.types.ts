import { BasePlayer } from '@pg/game/models/player.types';

export type User = {
  token: string;
} & BasePlayer;
