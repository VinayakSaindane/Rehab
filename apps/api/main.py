import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from database import db_manager, get_db_collection
from seed import seed_database
from routers import auth, patients, exercises, prescriptions, sessions, therapist, demo

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rehabsense")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing RehabSense backend...")
    await db_manager.connect()
    
    # Auto-seed if database is empty
    users_col = get_db_collection("users")
    user_count = await users_col.count_documents({})
    if user_count == 0:
        logger.info("Database appears uninitialized. Running auto-seeding...")
        await seed_database()
    else:
        logger.info(f"Database ready with {user_count} existing users.")
    
    yield
    logger.info("Shutting down RehabSense backend...")

app = FastAPI(
    title="RehabSense API",
    description="Camera-Assisted Home Rehabilitation Platform API — PS 05 (TechHives)",
    version=settings.VERSION,
    lifespan=lifespan
)

# Enable permissive CORS for seamless hackathon local development & demoing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(patients.router, prefix=settings.API_PREFIX)
app.include_router(exercises.router, prefix=settings.API_PREFIX)
app.include_router(prescriptions.router, prefix=settings.API_PREFIX)
app.include_router(sessions.router, prefix=settings.API_PREFIX)
app.include_router(therapist.router, prefix=settings.API_PREFIX)
app.include_router(demo.router, prefix=settings.API_PREFIX)

@app.get("/")
async def root():
    return {
        "platform": "RehabSense",
        "tagline": "Your Recovery. Your Camera. Your Care Team.",
        "status": "operational",
        "version": settings.VERSION,
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "storage": "in-memory-fallback" if db_manager.is_in_memory else "mongodb"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
