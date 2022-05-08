export type BasePlayer = {
  id: string;
  nickname: string;
};

export type MyPlayer = {
  token: string;
} & BasePlayer;

export type OtherPlayer = {
  connected: string;
} & BasePlayer;
