from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, JSON, func, Enum
import uuid
from sqlalchemy.orm import relationship
from db.db import Base
from api.enums import RunStatusEnum, IterationStatusEnum, FixStatusEnum, VisibilityEnum, TaskStatusEnum


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True) # Supabase User ID
    email = Column(String, unique=True, index=True, nullable=False)
    profile_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    projects = relationship("Project", back_populates="owner")


class Project(Base):
    __tablename__ = "projects"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4())[:8])
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    repo_url = Column(String, nullable=False)
    name = Column(String, nullable=False)
    tags = Column(JSON, nullable=True)
    visibility = Column(Enum(VisibilityEnum), default=VisibilityEnum.private)
    created_at = Column(DateTime, server_default=func.now())
    
    owner = relationship("User", back_populates="projects")
    runs = relationship("Run", back_populates="project")
    issues = relationship("Issue", back_populates="project")
    tasks = relationship("Task", back_populates="project")


class Run(Base):
    __tablename__ = "runs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4())[:8])
    project_id = Column(String, ForeignKey("projects.id"), nullable=True)

    repo_url = Column(String, index=True, nullable=False)
    team_name = Column(String, index=True, nullable=False)
    leader_name = Column(String, nullable=False)
    branch_name = Column(String, nullable=True)

    status = Column(Enum(RunStatusEnum), default=RunStatusEnum.pending)

    overall_score = Column(Float, nullable=True)
    total_failures = Column(Integer, default=0)
    total_fixes = Column(Integer, default=0)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    memory = Column(JSON, nullable=True)
    results_json = Column(JSON, nullable=True) # Added for raw SQL compatibility

    # Relationships
    project = relationship("Project", back_populates="runs")
    iterations = relationship(
        "Iteration",
        back_populates="run",
        cascade="all, delete-orphan"
    )
    fixes = relationship(
        "Fix",
        back_populates="run",
        cascade="all, delete-orphan"
    )


class Iteration(Base):
    __tablename__ = "iterations"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String, ForeignKey("runs.id"), nullable=False)
    iteration_number = Column(Integer, nullable=False)
    status = Column(Enum(IterationStatusEnum), default=IterationStatusEnum.running)  
    logs = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    run = relationship("Run", back_populates="iterations")
    fixes = relationship("Fix", back_populates="iteration")


class Fix(Base):
    __tablename__ = "fixes"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String, ForeignKey("runs.id"), nullable=False)
    iteration_id = Column(Integer, ForeignKey("iterations.id"), nullable=False)
    file_path = Column(String, nullable=False)
    bug_type = Column(String, nullable=False)
    line_number = Column(Integer, nullable=True)
    commit_message = Column(String, nullable=True)
    status = Column(Enum(FixStatusEnum), default=FixStatusEnum.applied)
    confidence_score = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    run = relationship("Run", back_populates="fixes")
    iteration = relationship("Iteration", back_populates="fixes")


class Issue(Base):
    __tablename__ = "issues"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    file = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    status = Column(String, default="open")
    assigned_to = Column(String, default="Unassigned")
    created_at = Column(DateTime, server_default=func.now())

    project = relationship("Project", back_populates="issues")


class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Enum(TaskStatusEnum), default=TaskStatusEnum.todo)
    created_at = Column(DateTime, server_default=func.now())

    project = relationship("Project", back_populates="tasks")