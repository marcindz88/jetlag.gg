import { BasePlayer } from '@pg/game-base/players/models/player.types';

export type User = {
  token: string;
} & BasePlayer;
