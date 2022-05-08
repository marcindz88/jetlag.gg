from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, constr

from app.game import exceptions
from app.game.core import GameSession
from app.tools.websocket_server import StarletteWebsocketServer, WebSocketSession


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
        raise HTTPException(status_code=400, detail="Lobby is full")

    return {"id": player.id, "token": player.token}


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
    game_session.remove_session(ws_session=ws_session)


def on_message(ws_session: WebSocketSession, msg: str):
    print("On message start", msg)

    print("On message end", msg)


@app.websocket("/ws/")
async def websocket_endpoint(websocket: WebSocket):
    server = StarletteWebsocketServer(
        validate=validate_connection,
        on_connect=on_connect,
        on_message=on_message,
        on_disconnect=on_disconnect,
    )
    await server.handler(websocket)
