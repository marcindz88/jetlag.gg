import asyncio
import threading
import uuid
from fastapi import WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

from app.tools.thread_manager import ThreadManager


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


class StarletteWebsocketServer:

    def __init__(self):
        self._thread_manager = ThreadManager()

        async def handler(websocket: WebSocket):
            ws_session = WebSocketSession(websocket, loop=asyncio.get_event_loop())
            if not self.validate_session(ws_session):
                await ws_session.connection.close(code=400)
                return
            await ws_session.connection.accept(subprotocol=ws_session.token)
            thread = threading.Thread(target=self.on_connect, args=(ws_session,))
            self._thread_manager.add_thread(str(ws_session.id), thread)
            while True:
                try:
                    message = await ws_session.connection.receive_text()
                    thread = threading.Thread(target=self.on_message, args=(ws_session, message,))
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
