import json
import logging
import os

from fastapi import FastAPI, WebSocket, HTTPException, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import constr, BaseModel
from fastapi.websockets import WebSocketDisconnect

from app.game import exceptions
from app.game.core.game import GameSession
from app.game.events import dict_to_event
from app.game.exceptions import PlayerNotFound
from app.game.persistence.redis import RedisPersistentStorage
from app.tools.timestamp import timestamp_now
from app.tools.websocket_server import StarletteWebsocketConnectionHandler, WebSocketSession


logging.getLogger().setLevel(logging.INFO)


redis_host = os.environ.get('GAME_REDIS_HOST') or "game_redis"
storage = RedisPersistentStorage(host=redis_host)

game_session = GameSession(storage=storage)
app = FastAPI()

origins = ["*"]  # todo

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/game/config/")
def get_config():
    return game_session.config.serialized()


class RegisterPlayerRequestBody(BaseModel):
    nickname: constr(min_length=1)


@app.post("/api/game/players/")
def register_player(body: RegisterPlayerRequestBody):
    nickname = body.nickname
    if ":" in nickname:
        raise HTTPException(status_code=400, detail="Invalid nickname")

    player = storage.add_new_player(nickname=body.nickname)

    return {
        "nickname": player.full_nickname,
        "token": player.token,
    }


@app.post("/api/game/join/")
def join_game_session(token: str = Header(default="")):
    persistent_player = storage.get_player_by_token(token=token)

    if not persistent_player:
        raise HTTPException(status_code=400, detail="Invalid token")

    try:
        player = game_session.add_player(nickname=persistent_player.full_nickname, token=token)
    except exceptions.PlayerLimitExceeded:
        raise HTTPException(status_code=409, detail="Lobby is full")
    except exceptions.DuplicatedGameSession:
        raise HTTPException(status_code=403, detail="Already in the game")

    return {**player.serialized, "token": player.token}


@app.post("/api/game/exit/")
def exit_game_session(token: str = Header(default="")):
    persistent_player = storage.get_player_by_token(token=token)

    if not persistent_player:
        raise HTTPException(status_code=400, detail="Invalid token")

    game_session.exit_player(token=token)


@app.get("/api/game/leaderboard/")
def leaderboard(
    limit: int = Query(default=10, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    player_list = storage.get_player_list(limit=limit, offset=offset)

    return player_list.serialized


@app.get("/api/game/leaderboard/{player_nickname}")
def leaderboard_player(player_nickname: str):
    player = storage.get_player(full_nickname=player_nickname)

    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    return player.serialized


@app.get("/api/game/leaderboard/{player_nickname}/last_games/")
def leaderboard_player_last_games(
    player_nickname: str,
    limit: int = Query(default=10, ge=1, le=10),
):
    games = storage.get_players_last_games(full_nickname=player_nickname, amount=limit)

    return [g.serialized for g in games]


class GameWebsocketConnectionHandler(StarletteWebsocketConnectionHandler):
    def validate_session(self, ws_session: WebSocketSession):
        token = ws_session.get_headers().get("sec-websocket-protocol", "")
        try:
            player = game_session.get_player_by_token(token)
        except exceptions.PlayerNotFound:
            return False
        if player.is_connected:
            return False

        ws_session.token = token
        ws_session.player_id = player.id
        return True

    def on_connect(self, ws_session: WebSocketSession):
        print("On connect", ws_session)
        player = game_session.get_player(player_id=ws_session.player_id)
        game_session.add_session(player=player, ws_session=ws_session)

    def on_disconnect(self, ws_session: WebSocketSession):
        print("On disconnect", ws_session)
        try:
            game_session.remove_session(ws_session=ws_session)
        except PlayerNotFound:
            pass

    def on_message(self, ws_session: WebSocketSession, message: str):
        print("on_message %s", message)
        try:
            data = json.loads(message)
            event = dict_to_event(data=data)
        except (json.JSONDecodeError, exceptions.InvalidEventFormat) as e:
            logging.error("Invalid event format: %s", e)
            return
        logging.info("on_message parsed event %s", event)

        player = game_session.get_player(player_id=ws_session.player_id)
        game_session.handle_event(player, event)


@app.websocket("/ws/")
async def websocket_endpoint(websocket: WebSocket):
    connection = GameWebsocketConnectionHandler()
    await connection.handler(websocket)


@app.websocket("/clock/")
async def clock_websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        try:
            data = await websocket.receive_text()
            await websocket.send_json({"t": timestamp_now(), "ref": data})
        except WebSocketDisconnect:
            break
