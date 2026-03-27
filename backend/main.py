from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ✅ Safe import (prevents crash if missing)
try:
    from config import MAX_RETRIES
except ImportError:
    MAX_RETRIES = 3

# ✅ KEEP THIS (YOUR DB INTEGRATION)
from db.db import engine
from db.models import Base

from api.routes import router as api_router
from api.sse import router as sse_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🔥 Creating tables in Neon...")
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(title="Hogriders CI/CD Agent API", lifespan=lifespan)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(api_router, prefix="/api")
app.include_router(sse_router)


# Health check
@app.get("/health")
def health_check():
    return {"status": "ok", "max_retries": MAX_RETRIES}

# Root
@app.get("/")
def root():
    return {"message": "Backend + DB working 🚀"}

# Run locally
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)