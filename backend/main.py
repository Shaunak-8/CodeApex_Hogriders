from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
try:
    from config import MAX_RETRIES
except ImportError:
    MAX_RETRIES = 3

from db.db import engine
from db.models import Base
from api.routes import router as api_router

app = FastAPI(title="Hogriders CI/CD Agent API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.on_event("startup")
def startup():
    print("🔥 Creating tables in Neon...")
    Base.metadata.create_all(bind=engine)

@app.get("/health")
def health_check():
    return {"status": "ok", "max_retries": MAX_RETRIES}

@app.get("/")
def root():
    return {"message": "Backend + DB working 🚀"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
