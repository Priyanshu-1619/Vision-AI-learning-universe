"""
AI Learning Universe — Master Single-Service Production Runner
Launches FastAPI serving both the backend API and frontend static SPA.

Usage:
    python start.py
    # or with custom port:
    PORT=10000 python start.py
"""
import os
import sys
from pathlib import Path

# Add backend directory to path
ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    print(f"================================================================")
    print(f"  AI LEARNING UNIVERSE — SINGLE-SERVICE PRODUCTION DEPLOYMENT   ")
    print(f"  Listening on http://{host}:{port}                              ")
    print(f"================================================================")
    uvicorn.run("main:app", host=host, port=port, app_dir=str(BACKEND_DIR), reload=False)
