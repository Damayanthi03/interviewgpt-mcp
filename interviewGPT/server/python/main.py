"""
client — Python FastAPI backend with MCP architecture.
All AI features route through specialized MCP Servers via the MCP protocol.
Auth routes connect directly to PostgreSQL (same schema as the Express server).
"""
import os
import sys
from contextlib import asynccontextmanager
from dotenv import load_dotenv
env_path = os.path.join(os.path.dirname(__file__), ".env")
print("Loading .env from:", env_path)

load_dotenv(dotenv_path=env_path, override=True)

print("DATABASE_URL =", os.getenv("DATABASE_URL"))
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from database import get_pool, close_pool
from routes.auth_routes import router as auth_router
from routes.resume_routes import router as resume_router
from routes.interview_routes import router as interview_router
from routes.coding_routes import router as coding_router
from routes.aptitude_routes import router as aptitude_router
from routes.communication_routes import router as communication_router
from routes.jobs_routes import router as jobs_router
from routes.recommendation_routes import router as recommendation_router

# Path to the built Vite frontend
_STATIC_DIR = os.path.normpath(os.path.join(
    os.path.dirname(__file__), "..", "..", "client", "dist", "public"
))


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: warm up the DB pool
    try:
        await get_pool()
        print("[client] ✅ Database pool ready", flush=True)
    except Exception as e:
        print(f"[client] ⚠️  Database not available: {e}", flush=True)

    print("[client] 🤖 MCP Servers will be spawned on first request", flush=True)
    yield
    # Shutdown
    await close_pool()
    print("[client] 🛑 Shutdown complete", flush=True)


app = FastAPI(
    title="client MCP API",
    description="AI-powered interview preparation platform using Model Context Protocol",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API Routes ─────────────────────────────────────────────────────────────────
app.include_router(auth_router, prefix="/api")
app.include_router(resume_router, prefix="/api")
app.include_router(interview_router, prefix="/api")
app.include_router(coding_router, prefix="/api")
app.include_router(aptitude_router, prefix="/api")
app.include_router(communication_router, prefix="/api")
app.include_router(jobs_router, prefix="/api")
app.include_router(recommendation_router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "client MCP API", "mcp_servers": [
        "resume", "coding", "hr", "aptitude", "job_analysis", "recommendation", "communication"
    ]}


# ── Static frontend (SPA) ──────────────────────────────────────────────────────
if os.path.isdir(_STATIC_DIR):
    _assets_dir = os.path.join(_STATIC_DIR, "assets")
    if os.path.isdir(_assets_dir):
        app.mount("/assets", StaticFiles(directory=_assets_dir), name="assets")
    print(f"[client] 🌐 Serving frontend from {_STATIC_DIR}", flush=True)
else:
    print(f"[client] ⚠️  Frontend build not found at {_STATIC_DIR}. Run: pnpm --filter @workspace/client run build", flush=True)


@app.get("/{path:path}")
async def serve_spa(path: str):
    """Serve built Vite SPA — return matching file or fall back to index.html."""
    if os.path.isdir(_STATIC_DIR):
        candidate = os.path.join(_STATIC_DIR, path)
        if path and os.path.isfile(candidate):
            return FileResponse(candidate)
        index = os.path.join(_STATIC_DIR, "index.html")
        if os.path.isfile(index):
            return FileResponse(index)
    return JSONResponse(
        status_code=503,
        content={"error": "Frontend not built. Run: pnpm --filter @workspace/client run build"},
    )


# ── Global error handler ───────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_handler(request: Request, exc: Exception):
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"error": str(exc) or "Internal server error"},
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
