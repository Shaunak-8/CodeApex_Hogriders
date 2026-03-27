from langgraph.graph import StateGraph, START, END
from typing import TypedDict, List, Optional
import os

from agents.analyzer import AnalyzerAgent
from agents.fixer import FixerRouter
from agents.validator import ValidatorAgent
from agents.reporter import ReporterAgent
from agents.memory import MemoryAgent

from api.sse import emit
from groq import Groq

from sqlalchemy.orm import Session
from db import crud

import tools.git_ops as git_ops


# ---------------- STATE ---------------- #

class AgentState(TypedDict):
    run_id: str
    repo_url: str
    repo_path: str
    team_name: str
    leader_name: str
    failures: List[dict]
    fixes_applied: List[dict]
    iteration: int
    max_retries: int
    status: str
    results: Optional[dict]
    db_iteration_id: int


# ---------------- ORCHESTRATOR ---------------- #

class OrchestratorAgent:
    def __init__(self, db: Session = None):
        self.analyzer = AnalyzerAgent()
        self.router = FixerRouter()
        self.validator = ValidatorAgent()
        self.reporter = ReporterAgent()
        self.memory = MemoryAgent()

        self.db = db

        self.groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

        workflow = StateGraph(AgentState)

        workflow.add_node("analyze", self.analyze_node)
        workflow.add_node("fix", self.fix_node)
        workflow.add_node("validate", self.validate_node)
        workflow.add_node("report", self.report_node)

        workflow.add_edge(START, "analyze")

        workflow.add_conditional_edges(
            "analyze",
            self.should_fix,
            {
                "continue": "fix",
                "end": "report"
            }
        )

        workflow.add_edge("fix", "validate")

        workflow.add_conditional_edges(
            "validate",
            self.should_retry,
            {
                "retry": "analyze",
                "end": "report"
            }
        )

        workflow.add_edge("report", END)

        self.app = workflow.compile()

    # ---------------- ANALYZE ---------------- #

    def analyze_node(self, state: AgentState):
        run_id = state["run_id"]

        emit(run_id, "OrchestratorAgent", "Starting analysis...", "ANALYSIS_STARTED")

        if self.db:
            iteration = crud.create_iteration(
                self.db,
                run_id=run_id,
                iteration_number=state["iteration"]
            )
            state["db_iteration_id"] = iteration.id

        failures = self.analyzer.run(state["repo_path"])
        state["failures"] = failures

        emit(run_id, "AnalyzerAgent", f"{len(failures)} failures detected", "ANALYSIS_DONE")

        return state

    # ---------------- FIX ---------------- #

    def fix_node(self, state: AgentState):
        run_id = state["run_id"]
        repo_path = state["repo_path"]

        for failure in state["failures"]:
            AgentClass = self.router.route(failure["bug_type"])

            from core.context_builder import ContextBuilder
            cb = ContextBuilder()

            agent = AgentClass(self.groq_client, cb)

            history = self.memory.get_context(failure["file"], failure.get("line", 0))

            fix_res = agent.fix(failure, repo_path, history)

            if fix_res and fix_res.get("fixed_code"):
                full_path = os.path.join(repo_path, failure["file"])

                with open(full_path, "w") as f:
                    f.write(fix_res["fixed_code"])

                fix_res["status"] = "applied"
                state["fixes_applied"].append(fix_res)

                emit(run_id, "FixerAgent", f"Fixed {failure['file']}", "FIX_APPLIED")

                # ✅ DB LOGGING (YOUR USP)
                if self.db:
                    crud.create_fix(
                        db=self.db,
                        run_id=run_id,
                        iteration_id=state.get("db_iteration_id"),
                        file_path=failure["file"],
                        bug_type=failure["bug_type"],
                        commit_message=fix_res.get("explanation", "Auto fix"),
                        status="applied"
                    )

        return state

    # ---------------- VALIDATE ---------------- #

    def validate_node(self, state: AgentState):
        run_id = state["run_id"]

        val_res = self.validator.validate(state["repo_path"])

        if val_res["status"] == "PASS":
            state["status"] = "PASSED"
        else:
            state["status"] = "FAILED"

        emit(run_id, "ValidatorAgent", state["status"], "VALIDATION_DONE")

        return state

    # ---------------- CONDITIONS ---------------- #

    def should_fix(self, state: AgentState):
        return "continue" if state["failures"] else "end"

    def should_retry(self, state: AgentState):
        if state["status"] == "PASSED":
            return "end"

        state["iteration"] += 1

        if state["iteration"] < state["max_retries"]:
            return "retry"

        return "end"

    # ---------------- REPORT ---------------- #

    def report_node(self, state: AgentState):
        run_id = state["run_id"]

        results = self.reporter.build_results(
            run_id=run_id,
            repo_url=state["repo_url"],
            final_status=state["status"],
            iterations=state["iteration"],
            failures_log=state["failures"],
            fixes=state["fixes_applied"]
        )

        state["results"] = results

        emit(run_id, "ReporterAgent", "Run completed", "DONE")

        # ✅ FINAL DB UPDATE
        if self.db:
            score = 100 if state["status"] == "PASSED" else 50

            crud.update_run(
                self.db,
                run_id=run_id,
                status=state["status"].lower(),
                overall_score=score,
                total_fixes=len(state["fixes_applied"]),
                total_failures=len(state["failures"])
            )

        return state

    # ---------------- RUN ---------------- #

    def run(self, run_id: str, repo_url: str, repo_path: str, team_name: str = "", leader_name: str = ""):
        max_retries = int(os.getenv("MAX_RETRIES", 5))

        emit(run_id, "OrchestratorAgent", "Run started", "START")

        initial_state = {
            "run_id": run_id,
            "repo_url": repo_url,
            "repo_path": repo_path,
            "team_name": team_name,
            "leader_name": leader_name,
            "failures": [],
            "fixes_applied": [],
            "iteration": 0,
            "max_retries": max_retries,
            "status": "RUNNING",
            "results": None,
            "db_iteration_id": 0
        }

        return self.app.invoke(initial_state)