from __future__ import annotations

from fastapi import HTTPException, status
from redis import Redis


def enforce_window(redis_client: Redis, bucket: str, limit: int, window_seconds: int = 60) -> None:
    count = redis_client.incr(bucket)
    if count == 1:
        redis_client.expire(bucket, window_seconds)
    if count > limit:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Rate limit exceeded.")

