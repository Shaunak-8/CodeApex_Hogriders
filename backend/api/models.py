from pydantic import BaseModel
from typing import List, Optional
from api.enums import VisibilityEnum, TaskStatusEnum

class ProjectCreate(BaseModel):
    repo_url: str
    name: str
    tags: List[str] = []
    visibility: VisibilityEnum = VisibilityEnum.private

class ProjectResponse(BaseModel):
    id: str
    repo_url: str
    name: str
    tags: List[str]
    visibility: VisibilityEnum
    created_at: str

class EnsureUserRequest(BaseModel):
    email: str
    profile_data: Optional[dict] = {}

class TaskCreate(BaseModel):
    description: str
    status: TaskStatusEnum = TaskStatusEnum.todo

class TaskUpdate(BaseModel):
    status: TaskStatusEnum

class WorkspaceChatRequest(BaseModel):
    project_id: str
    prompt: str

class RCARequest(BaseModel):
    project_id: str
    error_log: str

class InfraRequest(BaseModel):
    project_id: str

class RunRequest(BaseModel):
    repo_url: str
    team_name: str
    leader_name: str
    branch_name: Optional[str] = "main"
    project_id: Optional[str] = None
