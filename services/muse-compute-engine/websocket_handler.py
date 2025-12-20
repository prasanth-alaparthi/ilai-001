"""
WebSocket Handler for Real-Time Variable Sync
Broadcasts variable updates to connected clients
"""

import json
import asyncio
from typing import Dict, Set
from fastapi import WebSocket, WebSocketDisconnect


class ConnectionManager:
    """
    Manages WebSocket connections for real-time variable sync
    """
    
    def __init__(self):
        # Map user_id -> set of WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        async with self._lock:
            if user_id not in self.active_connections:
                self.active_connections[user_id] = set()
            self.active_connections[user_id].add(websocket)
    
    async def disconnect(self, websocket: WebSocket, user_id: str):
        """Remove a WebSocket connection"""
        async with self._lock:
            if user_id in self.active_connections:
                self.active_connections[user_id].discard(websocket)
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
    
    async def broadcast_to_user(self, user_id: str, message: dict):
        """Send message to all connections for a user"""
        if user_id not in self.active_connections:
            return
        
        dead_connections = set()
        
        for connection in self.active_connections[user_id]:
            try:
                await connection.send_json(message)
            except Exception:
                dead_connections.add(connection)
        
        # Clean up dead connections
        async with self._lock:
            for conn in dead_connections:
                self.active_connections[user_id].discard(conn)
    
    async def broadcast_variable_update(self, user_id: str, variable: dict):
        """Broadcast a variable update to all user's connections"""
        await self.broadcast_to_user(user_id, {
            "type": "variable_update",
            "data": variable
        })
    
    async def broadcast_variable_delete(self, user_id: str, symbol: str, subject: str):
        """Broadcast a variable deletion"""
        await self.broadcast_to_user(user_id, {
            "type": "variable_delete",
            "data": {"symbol": symbol, "subject": subject}
        })
    
    async def broadcast_injection(self, user_id: str, variable: dict, source: str):
        """Broadcast when a variable is injected from search"""
        await self.broadcast_to_user(user_id, {
            "type": "variable_injected",
            "data": variable,
            "source": source
        })
    
    def get_connection_count(self, user_id: str = None) -> int:
        """Get number of active connections"""
        if user_id:
            return len(self.active_connections.get(user_id, set()))
        return sum(len(conns) for conns in self.active_connections.values())


# Global connection manager instance
manager = ConnectionManager()
