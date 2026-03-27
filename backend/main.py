from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import MAX_RETRIES
from api.routes import router as api_router
from api.sse import router as sse_router

app = FastAPI(title="Hogriders CI/CD Agent API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")
app.include_router(sse_router)

@app.get("/health")
def health_check():
    return {"status": "ok", "max_retries": MAX_RETRIES}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
