"""FastAPI app entry point for AI Learning Universe."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import concepts, dictionary, health, labs, missions, roadmaps

app = FastAPI(
    title="AI Learning Universe API",
    description="Backend API for the AI Learning Universe — an interactive platform for learning ML/AI concepts.",
    version="0.1.0",
)

# CORS — allow the Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(concepts.router)
app.include_router(dictionary.router)
app.include_router(labs.router)
app.include_router(missions.router)
app.include_router(roadmaps.router)


@app.get("/")
async def root():
    return {
        "name": "AI Learning Universe API",
        "version": "0.1.0",
        "docs": "/docs",
    }
