"""FastAPI app entry point for AI Learning Universe — Single-Service Architecture."""
from __future__ import annotations

import os
from pathlib import Path
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from routers import concepts, dictionary, health, labs, missions, roadmaps, progress

app = FastAPI(
    title="AI Learning Universe",
    description="Unified API & Interactive Learning Platform for Data Science, Machine Learning, and Deep Learning.",
    version="1.0.0",
)

# CORS — allow development and production origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API routers
app.include_router(health.router)
app.include_router(concepts.router)
app.include_router(dictionary.router)
app.include_router(labs.router)
app.include_router(missions.router)
app.include_router(roadmaps.router)
app.include_router(progress.router)

# ── Single-Service Frontend Static Files & SPA Routing ─────────────

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"

# Mount /assets if the frontend has been built
if (FRONTEND_DIST / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")


@app.get("/{full_path:path}", include_in_schema=False)
async def spa_fallback(request: Request, full_path: str):
    """
    Single Page Application (SPA) fallback handler:
    1. Rejects unknown /api/* requests with a clean JSON 404.
    2. Serves static files directly if they exist in frontend/dist.
    3. Serves index.html for all valid client-side React routes.
    """
    # Safeguard: Unknown API calls must return JSON 404, never index.html
    if full_path.startswith("api/") or full_path == "api":
        raise HTTPException(
            status_code=404,
            detail=f"API endpoint '/{full_path}' not found."
        )

    # If specific static file exists in frontend/dist (e.g., favicon.ico, logo.svg)
    requested_file = FRONTEND_DIST / full_path
    if full_path and requested_file.is_file():
        return FileResponse(str(requested_file))

    # Single Page Application: serve index.html for client-side routing
    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))

    # Fallback if frontend has not been compiled yet
    return JSONResponse(
        status_code=200,
        content={
            "app": "AI Learning Universe API",
            "status": "online",
            "message": "Frontend build not detected in frontend/dist. Run 'npm run build' in the frontend directory to serve the UI.",
            "api_docs": "/docs",
            "health": "/api/health",
        }
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    print(f"Starting AI Learning Universe single-service server on {host}:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=False)
