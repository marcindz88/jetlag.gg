import threading
import uuid
from typing import Callable
import websockets
from fastapi import WebSocket, WebSocketDisconnect

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


class StarletteWebsocketServer:

    def __init__(self, on_connect: Callable, on_message: Callable, on_disconnect: Callable):
        self._thread_manager = ThreadManager()

        async def handler(websocket: WebSocket):
            await websocket.accept()
            websocket.id = uuid.uuid4()
            thread = threading.Thread(target=on_connect, args=(websocket,))
            self._thread_manager.add_thread(str(websocket.id), thread)
            while True:
                try:
                    message = await websocket.receive_text()
                    thread = threading.Thread(target=on_message, args=(websocket, message,))
                    self._thread_manager.add_thread(str(websocket.id), thread)
                except WebSocketDisconnect:
                    return on_disconnect(websocket)
        self.handler = handler
