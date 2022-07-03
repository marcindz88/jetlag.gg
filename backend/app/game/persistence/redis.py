import json
import uuid
from typing import Optional

import redis
from redis.commands.json.path import Path
from redis.commands.search.field import TagField, NumericField
from redis.commands.search.indexDefinition import IndexDefinition, IndexType
from redis.commands.search.query import Query

from app.game.persistence.base import BasePersistentStorage, Player, PlayerList


class RedisPersistentStorage(BasePersistentStorage):

    def __init__(self, host='game_redis', port=6379):
        super().__init__()
        self.client = redis.Redis(host=host, port=port, db=0, decode_responses=True)

    @staticmethod
    def _parse_player(nickname: str, player: dict) -> Player:
        return Player(
            full_nickname=nickname,
            token=player['token'],
            best_score=player['best_score'],
            best_shipment_num=player['best_shipment_num'],
            best_time_alive=player['best_time_alive'],
            best_timestamp=player['best_timestamp'],
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
        }
        nickname_number = self.client.incr(f"pnum:{nickname}")
        full_nickname = f"{nickname}:{nickname_number}"
        self.client.json().set(f'player:{full_nickname}', Path.root_path(), player)

        return self._parse_player(nickname=full_nickname, player=player)

    def get_player_by_token(self, token: str) -> Optional[Player]:
        try:
            result = self.client.ft("idx:players_json").search("@token:{ %s }" % token)
        except redis.ResponseError:
            return None

        if result.total != 1:
            return None

        document = result.docs[0]

        nickname = document.id.split(":", 1)[1]
        player = json.loads(document.json)

        if player['token'] != token:
            # lets make sure nobody did i.e. "8a*"
            return None

        return self._parse_player(nickname=nickname, player=player)

    def get_player_list(self, limit: int, offset: int) -> PlayerList:
        if limit <= 0 or offset < 0:
            raise ValueError

        print("get_player_list")

        query = Query(query_string="*").sort_by("best_score", asc=False).paging(offset=offset, num=limit)
        results = self.client.ft("idx:players_json").search(query)

        print("get_player_list 2")

        return PlayerList(
            total=results.total,
            results=[
                self._parse_player(nickname=d.id.split(":", 1)[1], player=json.loads(d.json)) for d in results.docs
            ],
        )

    def add_game_record(
        self,
        full_nickname: str,
        timestamp: int,
        score: int,
        shipments_delivered: int,
        time_alive: int,
    ) -> None:
        game = {
            "score": score,
            "shipment_num": shipments_delivered,
            "time_alive": time_alive,
        }

        player_key = f'player:{full_nickname}'

        def _update_best_score(pipe):
            player = pipe.json().get(player_key)
            if score <= player['best_score']:
                return
            pipe.multi()
            pipe.json().set(player_key, Path("best_score"), score)
            pipe.json().set(player_key, Path("best_shipment_num"), shipments_delivered)
            pipe.json().set(player_key, Path("best_time_alive"), time_alive)
            pipe.json().set(player_key, Path("best_timestamp"), timestamp)
            pipe.json().set(f"game:{full_nickname}:{timestamp}", Path.root_path(), game)

        self.client.transaction(_update_best_score, player_key)

    def clear_db(self):
        self.client.flushdb()

    def rebuild_index(self):
        index_name = "idx:players_json"
        try:
            self.client.ft(index_name).dropindex()
        except redis.ResponseError:
            pass

        index_schema = (
            TagField(
                '$.token',
                as_name='token',
            ),
            NumericField(
                '$.best_score',
                as_name='best_score',
                sortable=True,
            ),
        )

        self.client.ft(index_name).create_index(
            index_schema,
            definition=IndexDefinition(index_type=IndexType.JSON, prefix=["player:"])
        )
