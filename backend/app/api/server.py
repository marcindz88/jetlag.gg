import json
import logging

from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import constr, BaseModel
from fastapi.websockets import WebSocketDisconnect

from app.game import exceptions
from app.game.core.game import GameSession
from app.game.events import dict_to_event
from app.game.exceptions import PlayerNotFound
from app.tools.timestamp import timestamp_now
from app.tools.websocket_server import StarletteWebsocketServer, WebSocketSession


logging.getLogger().setLevel(logging.INFO)


game_session = GameSession()
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


@app.get("/api/game/players/")
def list_players():
    return game_session.player_list()


class AddPlayerRequestBody(BaseModel):
    nickname: constr(min_length=1)


@app.post("/api/game/players/")
def add_player(body: AddPlayerRequestBody):
    try:
        player = game_session.add_player(nickname=body.nickname)
    except exceptions.PlayerInvalidNickname:
        raise HTTPException(status_code=400, detail="Invalid nickname")
    except exceptions.PlayerLimitExceeded:
        raise HTTPException(status_code=409, detail="Lobby is full")

    return {**player.serialized, "token": player.token}


def validate_connection(ws_session: WebSocketSession) -> bool:
    token = ws_session.connection.headers.get("sec-websocket-protocol", "")
    try:
        player = game_session.get_player_by_token(token)
    except exceptions.PlayerNotFound:
        return False
    if player.is_connected:
        return False

    ws_session.token = token
    ws_session.player_id = player.id
    return True


def on_connect(ws_session: WebSocketSession):
    print("On connect", ws_session)
    player = game_session.get_player(player_id=ws_session.player_id)
    game_session.add_session(player=player, ws_session=ws_session)


def on_disconnect(ws_session: WebSocketSession):
    print("On disconnect", ws_session)
    try:
        game_session.remove_session(ws_session=ws_session)
    except PlayerNotFound:
        pass


def on_message(ws_session: WebSocketSession, body: str):
    logging.info("on_message %s", body)
    try:
        data = json.loads(body)
        event = dict_to_event(data=data)
    except (json.JSONDecodeError, exceptions.InvalidEventFormat) as e:
        logging.error("Invalid event format: %s", e)
        return
    logging.info("on_message parsed event %s", event)

    player = game_session.get_player(player_id=ws_session.player_id)
    game_session.handle_event(player, event)


@app.websocket("/ws/")
async def websocket_endpoint(websocket: WebSocket):
    server = StarletteWebsocketServer(
        validate=validate_connection,
        on_connect=on_connect,
        on_message=on_message,
        on_disconnect=on_disconnect,
    )
    await server.handler(websocket)


@app.websocket("/clock/")
async def clock_websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        try:
            data = await websocket.receive_text()
            await websocket.send_json({"t": timestamp_now(), "ref": data})
        except WebSocketDisconnect:
            break
