"""
Redis Rate Limiter with Cooling-Off Jail System
Tracks violations and implements escalating bans
"""

import os
import time
from typing import Optional, Dict, Any
from datetime import datetime

try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

# Redis connection
REDIS_URL = os.getenv("REDIS_URL", "redis://muse-redis:6379/0")

# Jail duration escalation (in seconds)
JAIL_DURATIONS = {
    1: 3600,      # 1st offense: 1 hour
    2: 86400,     # 2nd offense: 24 hours
    3: 604800,    # 3rd+ offense: 7 days
}

# Violation threshold before jailing
VIOLATION_THRESHOLD = 5


class RateLimitJail:
    """
    Redis-based rate limit jail system.
    Tracks violations per user and implements escalating bans.
    """
    
    def __init__(self):
        self._redis: Optional[redis.Redis] = None
    
    async def get_redis(self) -> Optional[redis.Redis]:
        """Get or create Redis connection"""
        if not REDIS_AVAILABLE:
            return None
        
        if self._redis is None:
            try:
                self._redis = redis.from_url(REDIS_URL, decode_responses=True)
                await self._redis.ping()
            except Exception as e:
                print(f"Redis connection failed: {e}")
                return None
        return self._redis
    
    async def close(self):
        """Close Redis connection"""
        if self._redis:
            await self._redis.close()
            self._redis = None
    
    async def record_violation(self, user_id: str) -> Dict[str, Any]:
        """
        Record a rate limit violation and check if user should be jailed.
        Returns jail info if jailed, otherwise violation count.
        """
        r = await self.get_redis()
        if not r:
            return {"jailed": False, "violations": 0, "message": "Redis unavailable"}
        
        violation_key = f"violation_count:{user_id}"
        jail_key = f"user_jail:{user_id}"
        offense_key = f"offense_count:{user_id}"
        
        try:
            # Check if already jailed
            jail_info = await self.check_jailed(user_id)
            if jail_info:
                return jail_info
            
            # Increment violation count (expires in 1 hour)
            violations = await r.incr(violation_key)
            if violations == 1:
                await r.expire(violation_key, 3600)  # 1 hour window
            
            # Check if threshold exceeded
            if violations >= VIOLATION_THRESHOLD:
                # Get offense count and increment
                offenses = await r.incr(offense_key)
                
                # Calculate jail duration based on offense count
                duration = self._get_jail_duration(offenses)
                
                # Set jail key
                await r.setex(jail_key, duration, "active")
                
                # Reset violation count
                await r.delete(violation_key)
                
                return {
                    "jailed": True,
                    "offense_count": offenses,
                    "duration_seconds": duration,
                    "duration_human": self._format_duration(duration),
                    "release_at": datetime.now().timestamp() + duration,
                    "message": f"Account suspended for {self._format_duration(duration)}"
                }
            
            return {
                "jailed": False,
                "violations": violations,
                "remaining": VIOLATION_THRESHOLD - violations,
                "message": f"Warning: {violations}/{VIOLATION_THRESHOLD} violations"
            }
            
        except Exception as e:
            return {"jailed": False, "error": str(e)}
    
    async def check_jailed(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Check if user is currently jailed.
        Returns jail info if jailed, None otherwise.
        """
        r = await self.get_redis()
        if not r:
            return None
        
        jail_key = f"user_jail:{user_id}"
        offense_key = f"offense_count:{user_id}"
        
        try:
            is_jailed = await r.get(jail_key)
            if not is_jailed:
                return None
            
            # Get remaining TTL
            ttl = await r.ttl(jail_key)
            offenses = await r.get(offense_key) or "1"
            
            return {
                "jailed": True,
                "offense_count": int(offenses),
                "remaining_seconds": max(0, ttl),
                "remaining_human": self._format_duration(max(0, ttl)),
                "release_at": datetime.now().timestamp() + ttl,
                "message": "Account temporarily suspended"
            }
            
        except Exception as e:
            return None
    
    async def get_violation_count(self, user_id: str) -> int:
        """Get current violation count for user"""
        r = await self.get_redis()
        if not r:
            return 0
        
        violation_key = f"violation_count:{user_id}"
        count = await r.get(violation_key)
        return int(count) if count else 0
    
    async def clear_jail(self, user_id: str) -> bool:
        """Manually clear a user's jail (admin function)"""
        r = await self.get_redis()
        if not r:
            return False
        
        jail_key = f"user_jail:{user_id}"
        violation_key = f"violation_count:{user_id}"
        
        await r.delete(jail_key, violation_key)
        return True
    
    def _get_jail_duration(self, offense_count: int) -> int:
        """Get jail duration based on offense count"""
        if offense_count >= 3:
            return JAIL_DURATIONS[3]
        return JAIL_DURATIONS.get(offense_count, JAIL_DURATIONS[1])
    
    def _format_duration(self, seconds: int) -> str:
        """Format duration in human-readable format"""
        if seconds >= 86400:
            days = seconds // 86400
            return f"{days} day{'s' if days > 1 else ''}"
        elif seconds >= 3600:
            hours = seconds // 3600
            return f"{hours} hour{'s' if hours > 1 else ''}"
        elif seconds >= 60:
            minutes = seconds // 60
            return f"{minutes} minute{'s' if minutes > 1 else ''}"
        else:
            return f"{seconds} seconds"


# Global jail instance
jail = RateLimitJail()
