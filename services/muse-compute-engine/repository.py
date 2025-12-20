"""
Variable Registry - Postgres Persistence Layer
Provides CRUD operations for cross-session variable storage
"""

import os
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

import asyncpg
from pydantic import BaseModel


# ==================== Models ====================

class VariableCreate(BaseModel):
    symbol: str
    value: str
    unit: Optional[str] = None
    subject: str = "general"  # math, physics, chemistry
    source: str = "user"      # user, search, calculated
    metadata: Optional[Dict[str, Any]] = None


class VariableUpdate(BaseModel):
    value: Optional[str] = None
    unit: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class Variable(BaseModel):
    id: str
    user_id: str
    symbol: str
    value: str
    unit: Optional[str]
    subject: str
    source: str
    metadata: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime


# ==================== Database Connection ====================

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@muse-postgres:5432/muse_labs")

_pool: Optional[asyncpg.Pool] = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
    return _pool


async def close_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


# ==================== Schema Initialization ====================

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS variable_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    symbol VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    unit VARCHAR(50),
    subject VARCHAR(50) DEFAULT 'general',
    source VARCHAR(50) DEFAULT 'user',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, symbol, subject)
);

CREATE INDEX IF NOT EXISTS idx_variables_user ON variable_registry(user_id);
CREATE INDEX IF NOT EXISTS idx_variables_subject ON variable_registry(subject);
CREATE INDEX IF NOT EXISTS idx_variables_symbol ON variable_registry(symbol);
"""


async def init_schema():
    """Initialize database schema"""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(SCHEMA_SQL)


# ==================== Repository ====================

class VariableRepository:
    """CRUD operations for variable registry"""
    
    @staticmethod
    async def get_all(user_id: str, subject: Optional[str] = None) -> List[Variable]:
        """Get all variables for a user, optionally filtered by subject"""
        pool = await get_pool()
        async with pool.acquire() as conn:
            if subject:
                rows = await conn.fetch(
                    "SELECT * FROM variable_registry WHERE user_id = $1 AND subject = $2 ORDER BY symbol",
                    uuid.UUID(user_id), subject
                )
            else:
                rows = await conn.fetch(
                    "SELECT * FROM variable_registry WHERE user_id = $1 ORDER BY subject, symbol",
                    uuid.UUID(user_id)
                )
            return [Variable(
                id=str(row['id']),
                user_id=str(row['user_id']),
                symbol=row['symbol'],
                value=row['value'],
                unit=row['unit'],
                subject=row['subject'],
                source=row['source'],
                metadata=row['metadata'],
                created_at=row['created_at'],
                updated_at=row['updated_at']
            ) for row in rows]
    
    @staticmethod
    async def get(user_id: str, symbol: str, subject: str = "general") -> Optional[Variable]:
        """Get a specific variable"""
        pool = await get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM variable_registry WHERE user_id = $1 AND symbol = $2 AND subject = $3",
                uuid.UUID(user_id), symbol, subject
            )
            if row:
                return Variable(
                    id=str(row['id']),
                    user_id=str(row['user_id']),
                    symbol=row['symbol'],
                    value=row['value'],
                    unit=row['unit'],
                    subject=row['subject'],
                    source=row['source'],
                    metadata=row['metadata'],
                    created_at=row['created_at'],
                    updated_at=row['updated_at']
                )
            return None
    
    @staticmethod
    async def upsert(user_id: str, data: VariableCreate) -> Variable:
        """Create or update a variable"""
        pool = await get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow("""
                INSERT INTO variable_registry (user_id, symbol, value, unit, subject, source, metadata)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (user_id, symbol, subject)
                DO UPDATE SET 
                    value = EXCLUDED.value,
                    unit = EXCLUDED.unit,
                    source = EXCLUDED.source,
                    metadata = EXCLUDED.metadata,
                    updated_at = NOW()
                RETURNING *
            """,
                uuid.UUID(user_id),
                data.symbol,
                data.value,
                data.unit,
                data.subject,
                data.source,
                data.metadata
            )
            return Variable(
                id=str(row['id']),
                user_id=str(row['user_id']),
                symbol=row['symbol'],
                value=row['value'],
                unit=row['unit'],
                subject=row['subject'],
                source=row['source'],
                metadata=row['metadata'],
                created_at=row['created_at'],
                updated_at=row['updated_at']
            )
    
    @staticmethod
    async def update(user_id: str, symbol: str, subject: str, data: VariableUpdate) -> Optional[Variable]:
        """Update a variable's value"""
        pool = await get_pool()
        async with pool.acquire() as conn:
            # Build dynamic update
            updates = []
            params = [uuid.UUID(user_id), symbol, subject]
            param_idx = 4
            
            if data.value is not None:
                updates.append(f"value = ${param_idx}")
                params.append(data.value)
                param_idx += 1
            
            if data.unit is not None:
                updates.append(f"unit = ${param_idx}")
                params.append(data.unit)
                param_idx += 1
            
            if data.metadata is not None:
                updates.append(f"metadata = ${param_idx}")
                params.append(data.metadata)
                param_idx += 1
            
            if not updates:
                return await VariableRepository.get(user_id, symbol, subject)
            
            updates.append("updated_at = NOW()")
            
            row = await conn.fetchrow(f"""
                UPDATE variable_registry
                SET {', '.join(updates)}
                WHERE user_id = $1 AND symbol = $2 AND subject = $3
                RETURNING *
            """, *params)
            
            if row:
                return Variable(
                    id=str(row['id']),
                    user_id=str(row['user_id']),
                    symbol=row['symbol'],
                    value=row['value'],
                    unit=row['unit'],
                    subject=row['subject'],
                    source=row['source'],
                    metadata=row['metadata'],
                    created_at=row['created_at'],
                    updated_at=row['updated_at']
                )
            return None
    
    @staticmethod
    async def delete(user_id: str, symbol: str, subject: str = "general") -> bool:
        """Delete a variable"""
        pool = await get_pool()
        async with pool.acquire() as conn:
            result = await conn.execute(
                "DELETE FROM variable_registry WHERE user_id = $1 AND symbol = $2 AND subject = $3",
                uuid.UUID(user_id), symbol, subject
            )
            return result == "DELETE 1"
    
    @staticmethod
    async def get_as_dict(user_id: str, subject: Optional[str] = None) -> Dict[str, Any]:
        """Get variables as a dictionary for calculation context"""
        variables = await VariableRepository.get_all(user_id, subject)
        return {v.symbol: float(v.value) if v.value.replace('.','').replace('-','').isdigit() else v.value for v in variables}
