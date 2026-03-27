from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class RunRequest(BaseModel):
    repo_url: str
    team_name: str
    leader_name: str

@router.post("/run")
def run_agent(request: RunRequest):
    return { 
        "run_id": "mock-123", 
        "status": "started",
        "branch": "HOGRIDERS_EKLAVYA_PURI_AI_Fix"
    }

@router.get("/results/{run_id}")
def get_results(run_id: str):
    return {"status": "mock data"}

@router.get("/status/{run_id}")
def get_status(run_id: str):
    return {"status": "started"}
