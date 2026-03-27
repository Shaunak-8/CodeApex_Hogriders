from langgraph.graph import StateGraph, START, END
from typing import TypedDict, List, Optional
import os
import time
from agents.analyzer import AnalyzerAgent
from agents.fixer import FixerRouter
from agents.validator import ValidatorAgent
from agents.reporter import ReporterAgent
from agents.memory import MemoryAgent
from api.sse import emit
from groq import Groq

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

class OrchestratorAgent:
    def __init__(self):
        self.analyzer = AnalyzerAgent()
        self.router = FixerRouter()
        self.validator = ValidatorAgent()
        self.reporter = ReporterAgent()
        self.memory = MemoryAgent()
        
        # Initialize Groq client
        self.groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        
        # Build LangGraph
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

    def analyze_node(self, state: AgentState):
        run_id = state["run_id"]
        emit(run_id, "OrchestratorAgent", "Starting analysis phase...", "ANALYSIS_STARTED")
        
        failures = self.analyzer.run(state["repo_path"])
        state["failures"] = failures
        
        if failures:
            emit(run_id, "AnalyzerAgent", f"Detected {len(failures)} failures.", "FAILURE_DETECTED")
        else:
            emit(run_id, "AnalyzerAgent", "No failures detected.", "ANALYSIS_COMPLETED")
            
        return state

    def should_fix(self, state: AgentState):
        if not state["failures"]:
            return "end"
        return "continue"

    def fix_node(self, state: AgentState):
        run_id = state["run_id"]
        repo_path = state["repo_path"]
        
        for failure in state["failures"]:
            emit(run_id, "OrchestratorAgent", f"Routing {failure['bug_type']} in {failure['file']}...", "FIX_ROUTED")
            
            AgentClass = self.router.route(failure["bug_type"])
            # In production, context_builder would be passed here
            # For now using a mock/simple context builder or dependency
            from core.context_builder import ContextBuilder
            cb = ContextBuilder()
            
            agent = AgentClass(self.groq_client, cb)
            
            # Use memory for history
            history = self.memory.get_context(failure["file"], failure.get("line", 0))
            
            fix_res = agent.fix(failure, repo_path, history)
            
            if fix_res and fix_res.get("fixed_code"):
                # Apply fix to file
                full_path = os.path.join(repo_path, failure["file"])
                with open(full_path, "w") as f:
                    f.write(fix_res["fixed_code"])
                
                fix_res["status"] = "applied"
                fix_res["file"] = failure["file"]
                fix_res["bug_type"] = failure["bug_type"]
                state["fixes_applied"].append(fix_res)
                
                emit(run_id, agent.specialty + "Agent", f"Applied fix to {failure['file']}: {fix_res.get('explanation', '')}", "FIX_APPLIED")
            else:
                emit(run_id, "OrchestratorAgent", f"Failed to generate fix for {failure['file']}", "FIX_FAILED")
                
        return state

    def validate_node(self, state: AgentState):
        run_id = state["run_id"]
        emit(run_id, "ValidatorAgent", "Validating fixes...", "VALIDATION_STARTED")
        
        # Simplified validation: just run analyzer again
        val_res = self.validator.validate(state["repo_path"])
        
        if val_res["status"] == "PASS":
            state["status"] = "PASSED"
            emit(run_id, "ValidatorAgent", "All tests passed!", "VALIDATION_RESULT")
        else:
            state["status"] = "FAILED"
            emit(run_id, "ValidatorAgent", f"Validation failed. {val_res['remaining_failures']} remaining.", "VALIDATION_RESULT")
            
        return state

    def should_retry(self, state: AgentState):
        if state["status"] == "PASSED":
            return "end"
        
        state["iteration"] += 1
        if state["iteration"] < state["max_retries"]:
            return "retry"
        
        return "end"

    def report_node(self, state: AgentState):
        run_id = state["run_id"]
        emit(run_id, "ReporterAgent", "Generating final report...", "COMMIT_STARTED")
        
        # Commit and push
        try:
            from tools.git_ops import commit_and_push
            branch_name = f"{state['team_name']}_{state['leader_name']}_AI_Fix"
            commit_and_push(state["repo_path"], "[AI-AGENT] Applied autonomous fixes", branch_name)
            emit(run_id, "GitAgent", f"Pushed fixes to branch {branch_name}", "COMMIT_DONE")
        except Exception as e:
            emit(run_id, "GitAgent", f"Git push failed: {str(e)}", "COMMIT_FAILED")

        results = self.reporter.build_results(
            run_id=run_id,
            repo_url=state["repo_url"],
            final_status=state["status"],
            iterations=state["iteration"] + 1,
            failures_log=state["failures"],
            fixes=state["fixes_applied"]
        )
        state["results"] = results
        
        emit(run_id, "OrchestratorAgent", "Run completed.", "RUN_COMPLETED")
        return state

    def run(self, run_id: str, repo_url: str, repo_path: str, team_name: str = "", leader_name: str = ""):
        max_retries = int(os.getenv("MAX_RETRIES", 5))
        
        emit(run_id, "OrchestratorAgent", f"Run started for {repo_url}", "RUN_STARTED")
        
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
            "results": None
        }
        
        return self.app.invoke(initial_state)
