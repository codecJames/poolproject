from typing import Dict, Set
from starlette.websockets import WebSocket
import asyncio

class WSManager:
    def __init__(self):
        # map tournament_id -> set of websockets
        self.connections: Dict[int, Set[WebSocket]] = {}
        self.lock = asyncio.Lock()

    async def connect(self, tournament_id: int, websocket: WebSocket):
        await websocket.accept()
        async with self.lock:
            self.connections.setdefault(tournament_id, set()).add(websocket)

    async def disconnect(self, tournament_id: int, websocket: WebSocket):
        async with self.lock:
            conns = self.connections.get(tournament_id)
            if conns and websocket in conns:
                conns.remove(websocket)

    async def broadcast(self, tournament_id: int, message: dict):
        conns = list(self.connections.get(tournament_id, set()))
        for ws in conns:
            try:
                await ws.send_json(message)
            except Exception:
                # ignore send errors
                pass
