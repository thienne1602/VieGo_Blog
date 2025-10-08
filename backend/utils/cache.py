"""
Caching utilities for VieGo Blog backend
Provides simple in-memory caching with TTL support
"""
import time
from functools import wraps
from typing import Any, Dict, Optional

class SimpleCache:
    def __init__(self, default_ttl: int = 300):
        """
        Initialize cache with default TTL in seconds
        Args:
            default_ttl: Default time to live in seconds (5 minutes default)
        """
        self.cache: Dict[str, Dict] = {}
        self.default_ttl = default_ttl
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Store value in cache with TTL"""
        ttl = ttl or self.default_ttl
        expires_at = time.time() + ttl
        self.cache[key] = {
            'value': value,
            'expires_at': expires_at
        }
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache if not expired"""
        if key not in self.cache:
            return None
        
        cache_item = self.cache[key]
        if time.time() > cache_item['expires_at']:
            del self.cache[key]
            return None
        
        return cache_item['value']
    
    def delete(self, key: str) -> bool:
        """Delete specific cache entry"""
        if key in self.cache:
            del self.cache[key]
            return True
        return False
    
    def clear(self) -> None:
        """Clear all cache entries"""
        self.cache.clear()
    
    def cleanup_expired(self) -> int:
        """Remove expired entries and return count"""
        current_time = time.time()
        expired_keys = [
            key for key, item in self.cache.items() 
            if current_time > item['expires_at']
        ]
        
        for key in expired_keys:
            del self.cache[key]
        
        return len(expired_keys)

# Global cache instance
cache = SimpleCache()

def cached_route(ttl: int = 300):
    """
    Decorator for caching Flask route responses
    Args:
        ttl: Time to live in seconds
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            from flask import request
            
            # Generate cache key from route and query parameters
            cache_key = f"{request.endpoint}:{request.args.to_dict()}"
            
            # Try to get from cache first
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            
            return result
        return wrapper
    return decorator

def cache_key(*args, **kwargs) -> str:
    """Generate cache key from arguments"""
    key_parts = [str(arg) for arg in args]
    key_parts.extend([f"{k}:{v}" for k, v in sorted(kwargs.items())])
    return ":".join(key_parts)