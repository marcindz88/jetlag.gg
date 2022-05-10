import asyncio
import threading
import uuid
from typing import Callable
import websockets
from fastapi import WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

from app.tools.thread_manager import ThreadManager


class WebsocketServer:

    def __init__(self, on_connect: Callable, on_message: Callable, on_close: Callable):
        self._thread_manager = ThreadManager()

        async def handler(websocket):
            thread = threading.Thread(target=on_connect, args=(websocket,))
            self._thread_manager.add_thread(str(websocket.id), thread)
            while True:
                try:
                    message = await websocket.recv()
                    thread = threading.Thread(target=on_message, args=(websocket, message,))
                    self._thread_manager.add_thread(str(websocket.id), thread)

                except websockets.ConnectionClosedError:
                    return on_close(websocket)
        self.handler = handler


class WebSocketSession:
    connection: WebSocket
    id: uuid.UUID
    token: str
    player_id: uuid.UUID

    def __init__(self, websocket):
        self.id = uuid.uuid4()
        self.connection = websocket

    def close_connection(self, code=1000, reason=""):
        if self.connection.client_state == WebSocketState.DISCONNECTED:
            return
        loop = asyncio.get_event_loop()
        coroutine = self.connection.close(code=code, reason=reason)
        loop.run_until_complete(coroutine)

    def send(self, data: dict):
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
        coroutine = self.connection.send_json(data)
        loop.run_until_complete(coroutine)


class StarletteWebsocketServer:

    def __init__(self, validate: Callable, on_connect: Callable, on_message: Callable, on_disconnect: Callable):
        self._thread_manager = ThreadManager()

        async def handler(websocket: WebSocket):
            ws_session = WebSocketSession(websocket)
            if not validate(ws_session):
                await ws_session.connection.close(code=400)
                return
            await ws_session.connection.accept(subprotocol=ws_session.token)
            thread = threading.Thread(target=on_connect, args=(ws_session,))
            self._thread_manager.add_thread(str(ws_session.id), thread)
            while True:
                try:
                    message = await ws_session.connection.receive_text()
                    thread = threading.Thread(target=on_message, args=(ws_session, message,))
                    self._thread_manager.add_thread(str(ws_session.id), thread)
                except WebSocketDisconnect:
                    thread = threading.Thread(target=on_disconnect, args=(ws_session,))
                    self._thread_manager.add_thread(str(ws_session.id), thread)
                    return
        self.handler = handler
