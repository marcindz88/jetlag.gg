import uuid
from typing import Optional, List

import redis

from app.game.enums import DeathCause
from app.game.persistence.base import BasePersistentStorage, Player, PlayerList, Game


class RedisPersistentStorage(BasePersistentStorage):

    def __init__(self, host='game_redis', port=6379):
        super().__init__()
        self.client = redis.Redis(host=host, port=port, db=0, decode_responses=True)

    @staticmethod
    def _parse_player(nickname: str, player: dict, position: int = None) -> Player:
        return Player(
            full_nickname=nickname,
            token=player['token'],
            position=position,
            best_score=int(player['best_score']),
            best_shipment_num=int(player['best_shipment_num']),
            best_time_alive=int(player['best_time_alive']),
            best_timestamp=int(player['best_timestamp']),
            best_death_cause=DeathCause(player['best_death_cause']) if player['best_death_cause'] else None,
        )

    def add_new_player(self, nickname: str) -> Player:
        nickname = nickname.strip()
        if len(nickname) == 0:
            raise ValueError
        if ":" in nickname:
            raise ValueError

        token = uuid.uuid4().hex
        player = {
            'token': token,
            'best_score': -1,
            'best_shipment_num': -1,
            'best_time_alive': -1,
            'best_timestamp': -1,
            'best_death_cause': "",
        }
        nickname_number = self.client.hincrby("nickname_frequencies", nickname, 1)
        full_nickname = f"{nickname}:{nickname_number}"
        self.client.hset(f'player:{full_nickname}', mapping=player)
        self.client.hset("tokens", token, full_nickname)

        return self._parse_player(nickname=full_nickname, player=player)

    def get_player_by_token(self, token: str) -> Optional[Player]:
        full_nickname = self.client.hget("tokens", token)
        if not full_nickname:
            return None

        player = self.client.hgetall(f"player:{full_nickname}")
        return self._parse_player(nickname=full_nickname, player=player)

    def get_player_list(self, limit: int, offset: int) -> PlayerList:
        if limit <= 0 or offset < 0:
            raise ValueError

        full_names = self.client.zrevrange("player_score_index", offset, offset + limit - 1)

        pipe = self.client.pipeline()
        pipe.zcard("player_score_index")
        keys = [f"player:{name}" for name in full_names]
        for key in keys:
            pipe.hgetall(key)
        pipe_result = pipe.execute()
        total = pipe_result.pop(0)
        players = pipe_result

        return PlayerList(
            total=total,
            results=[
                self._parse_player(
                    nickname=full_names[i],
                    player=players[i],
                    position=offset+i,
                ) for i in range(len(full_names))
            ],
        )

    def get_player(self, full_nickname: str) -> Optional[Player]:
        # for leaderboard needs, so return with a position
        player = self.client.hgetall(f"player:{full_nickname}")
        if not player:
            return None

        position = self.client.zrevrank("player_score_index", full_nickname)

        return self._parse_player(
            nickname=full_nickname,
            player=player,
            position=position,
        )

    def get_players_last_games(self, full_nickname: str, amount=10) -> List[Game]:
        if amount > 10:
            raise ValueError

        timestamps = self.client.lrange(f"last_games:{full_nickname}", 0, amount-1)

        pipe = self.client.pipeline()
        for timestamp in timestamps:
            pipe.hgetall(f"game:{full_nickname}:{timestamp}")
        games = pipe.execute()
        for game, timestamp in zip(games, timestamps):
            game['timestamp'] = timestamp

        return [
            Game(
                score=int(g['score']),
                shipment_num=int(g['shipment_num']),
                time_alive=int(g['time_alive']),
                timestamp=int(g['timestamp']),
                death_cause=DeathCause(g['death_cause']),
            ) for g in games
        ]

    def add_game_record(
        self,
        full_nickname: str,
        timestamp: int,
        score: int,
        shipments_delivered: int,
        time_alive: int,
        death_cause: DeathCause,
    ) -> None:
        game = {
            "score": score,
            "shipment_num": shipments_delivered,
            "time_alive": time_alive,
            "death_cause": death_cause,
        }
        player_key = f'player:{full_nickname}'

        def _add_game_record(pipe):
            player = pipe.hgetall(player_key)
            pipe.multi()
            pipe.hset(f"game:{full_nickname}:{timestamp}", mapping=game)
            pipe.lpush(f"last_games:{full_nickname}", timestamp)
            pipe.ltrim(f"last_games:{full_nickname}", 0, 9)
            if score <= int(player['best_score']):
                return
            pipe.hset(player_key, mapping={
                "best_score": score,
                "best_shipment_num": shipments_delivered,
                "best_time_alive": time_alive,
                "best_timestamp": timestamp,
                "best_death_cause": death_cause,
            })
            pipe.zadd("player_score_index", {full_nickname: score})

        self.client.transaction(_add_game_record, player_key)

    def clear_db(self):
        self.client.flushdb()
