from pydantic import BaseModel
from typing import List, Optional

class ProjectCreate(BaseModel):
    repo_url: str
    name: str
    tags: List[str] = []
    visibility: str = "private"

class ProjectResponse(BaseModel):
    id: str
    repo_url: str
    name: str
    tags: List[str]
    visibility: str
    created_at: str

class EnsureUserRequest(BaseModel):
    email: str
    profile_data: Optional[dict] = {}

class TaskCreate(BaseModel):
    description: str
    status: str = 'todo'

class TaskUpdate(BaseModel):
    status: str

class WorkspaceChatRequest(BaseModel):
    project_id: str
    prompt: str

class RCARequest(BaseModel):
    error_log: str

class InfraRequest(BaseModel):
    project_id: str
