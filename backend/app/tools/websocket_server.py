import asyncio
import threading
import time
import uuid
from fastapi import WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

from app.tools.thread_manager import ThreadManager
from app.tools.timestamp import timestamp_now


class WebSocketSession:
    connection: WebSocket
    id: uuid.UUID
    token: str
    player_id: uuid.UUID

    def __init__(self, websocket, loop: asyncio.AbstractEventLoop):
        self.id = uuid.uuid4()
        self.connection = websocket
        self._loop = loop

    def close_connection(self, code=1000, reason=""):
        if self.connection.client_state == WebSocketState.DISCONNECTED:
            return
        coroutine = self.connection.close(code=code, reason=reason)
        self._loop.create_task(coroutine)

    def send(self, data: dict):
        coroutine = self.connection.send_json(data)
        self._loop.create_task(coroutine)

    def send_text(self, data: str):
        coroutine = self.connection.send_text(data)
        self._loop.create_task(coroutine)


class StarletteWebsocketConnectionHandler:
    ping_interval = 2000  # in milliseconds
    max_pong_awaiting_time = 2000  # in milliseconds

    def __init__(self):
        self._thread_manager = ThreadManager()
        self.last_ping = 0
        self.last_pong = 0

        if self.max_pong_awaiting_time > self.ping_interval:
            raise ValueError

        def heartbeat(session: WebSocketSession):
            while True:
                session.send_text("ping")
                self.last_ping = timestamp_now()
                time.sleep(self.max_pong_awaiting_time/1000)
                delta = self.last_pong - self.last_ping
                if delta >= self.max_pong_awaiting_time or delta < 0:
                    session.close_connection(code=1005)
                    break
                time.sleep((self.ping_interval - self.max_pong_awaiting_time)/1000)

        async def handler(websocket: WebSocket):
            ws_session = WebSocketSession(websocket, loop=asyncio.get_event_loop())
            if not self.validate_session(ws_session):
                await ws_session.connection.close(code=3000)
                return
            await ws_session.connection.accept(subprotocol=ws_session.token, headers=[
                (b"ping_interval", str(self.ping_interval).encode()),
                (b"max_pong_awaiting_time", str(self.max_pong_awaiting_time).encode()),
            ])
            thread = threading.Thread(target=self.on_connect, args=(ws_session,))
            self._thread_manager.add_thread(str(ws_session.id), thread)

            heartbeat_thread = threading.Thread(target=heartbeat, args=(ws_session,))
            heartbeat_thread.start()

            while True:
                try:
                    message = await ws_session.connection.receive_text()

                    if message == "pong":
                        self.last_pong = timestamp_now()
                        continue

                    thread = threading.Thread(
                        target=self.on_message,
                        args=(
                            ws_session,
                            message,
                        ),
                    )
                    self._thread_manager.add_thread(str(ws_session.id), thread)
                except WebSocketDisconnect:
                    thread = threading.Thread(target=self.on_disconnect, args=(ws_session,))
                    self._thread_manager.add_thread(str(ws_session.id), thread)
                    return

        self.handler = handler

    def validate_session(self, ws_session: WebSocketSession) -> bool:
        raise NotImplemented

    def on_connect(self, ws_session: WebSocketSession):
        raise NotImplemented

    def on_message(self, ws_session: WebSocketSession, message: str):
        raise NotImplemented

    def on_disconnect(self, ws_session: WebSocketSession):
        raise NotImplemented
