import os
import asyncpg
from typing import Optional
print("DATABASE_URL =", os.getenv("DATABASE_URL"))
_pool: Optional[asyncpg.Pool] = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        url = os.environ.get("DATABASE_URL", "")
        if not url:
            raise RuntimeError("DATABASE_URL not set")
        url = url.replace("postgresql+asyncpg://", "postgresql://")
        _pool = await asyncpg.create_pool(url, min_size=1, max_size=5)
    return _pool


async def close_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


def row_to_dict(record) -> dict:
    if record is None:
        return None
    return dict(record)


def public_user(user: dict) -> dict:
    if user is None:
        return None
    excluded = {"password_hash", "otp", "otp_expires_at"}
    return {k: v for k, v in user.items() if k not in excluded}
