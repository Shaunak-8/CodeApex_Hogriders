from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, JSON, func
from sqlalchemy.orm import relationship
from db.db import Base


class Run(Base):
    __tablename__ = "runs"

    id = Column(String, primary_key=True, index=True)

    repo_url = Column(String, index=True, nullable=False)
    team_name = Column(String, index=True, nullable=False)
    leader_name = Column(String, nullable=False)

    # 🔥 REQUIRED for hackathon
    branch_name = Column(String, nullable=True)

    # Status tracking
    status = Column(String, default="pending")  # pending, running, completed, failed

    # Dashboard + scoring
    overall_score = Column(Float, nullable=True)
    total_failures = Column(Integer, default=0)
    total_fixes = Column(Integer, default=0)

    # Timestamps (server-side via func.now())
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # 🔥 USP: Failure Ledger / Memory
    memory = Column(JSON, nullable=True)

    # Relationships
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
    """Tracks each CI/CD iteration attempt"""

    __tablename__ = "iterations"

    id = Column(Integer, primary_key=True, index=True)

    run_id = Column(String, ForeignKey("runs.id"), nullable=False)

    iteration_number = Column(Integer, nullable=False)

    status = Column(String, default="running")  
    # running, testing, pass, fail

    logs = Column(Text, nullable=True)

    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    run = relationship("Run", back_populates="iterations")

    fixes = relationship("Fix", back_populates="iteration")


class Fix(Base):
    """Tracks each fix applied by the agent"""

    __tablename__ = "fixes"

    id = Column(Integer, primary_key=True, index=True)

    run_id = Column(String, ForeignKey("runs.id"), nullable=False)
    iteration_id = Column(Integer, ForeignKey("iterations.id"), nullable=False)

    file_path = Column(String, nullable=False)

    bug_type = Column(String, nullable=False)
    # LINTING, SYNTAX, LOGIC, TYPE_ERROR, IMPORT, INDENTATION

    line_number = Column(Integer, nullable=True)

    commit_message = Column(String, nullable=True)

    status = Column(String, default="applied")
    # applied, pass, fail, reverted

    confidence_score = Column(Float, nullable=True)

    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    run = relationship("Run", back_populates="fixes")
    iteration = relationship("Iteration", back_populates="fixes")