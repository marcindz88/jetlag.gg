export type GameStats = {
  delivered_shipments: number;
  score: number;
  time_alive: number;
  death_cause: number;
  timestamp: number;
};

export type LeaderboardPlayerResult = {
  nickname: string;
  position: number;
  best_game: GameStats;
};

export type LeaderboardResponse = {
  results: LeaderboardPlayerResult[];
  total: number;
};
