import time
from typing import Optional

from fastapi import FastAPI, WebSocket

from app.tools.websocket_server import StarletteWebsocketServer

app = FastAPI()


SHARED_BUFFER = {

}


@app.get("/")
def read_root():
    return {"Hello": "World", "buffer": SHARED_BUFFER}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Optional[str] = None):
    return {"item_id": item_id, "q": q}


def custom_sleep(seconds):
    start = time.time()
    while True:
        if (time.time() - start) >= seconds:
            break


def on_message(websocket: WebSocket, msg: str):
    print("On message start", msg)
    SHARED_BUFFER[str(time.time())] = msg
    custom_sleep(6)
    print("On message end", msg)


def on_connect(websocket: WebSocket):
    print("On connect start", websocket)
    custom_sleep(6)
    print("On connect end", websocket)


def on_disconnect(websocket: WebSocket):
    print("On disconnect", websocket)


@app.websocket("/ws/")
async def websocket_endpoint(websocket: WebSocket):
    server = StarletteWebsocketServer(
        on_connect=on_connect,
        on_message=on_message,
        on_disconnect=on_disconnect,
    )
    await server.handler(websocket)
