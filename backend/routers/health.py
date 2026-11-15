"""Health check router for Render single-service deployment."""
import os
import time
from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["health"])

START_TIME = time.time()

@router.get("/health")
async def health_check():
    """Lightweight health check endpoint returning system status."""
    return {
        "status": "healthy",
        "app": "AI Learning Universe API",
        "version": "1.0.0",
        "uptimeSeconds": round(time.time() - START_TIME, 1),
        "environment": os.environ.get("ENVIRONMENT", "production"),
        "singleService": True,
    }
