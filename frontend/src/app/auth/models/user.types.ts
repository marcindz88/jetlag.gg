import { BasePlayer } from '@pg/players/models/player.types';

export type User = {
  token: string;
} & BasePlayer;
