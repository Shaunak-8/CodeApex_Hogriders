from langgraph.graph import StateGraph, START, END
from typing import TypedDict, List
import agents.analyzer as analyzer
import agents.fixer as fixer
import agents.validator as validator
import agents.reporter as reporter
import sys
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

# --- SIMPLE HACKATHON ORCHESTRATOR implementation below ---

# Add parent directory to path to allow importing from 'agents' and 'core' when run directly
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from agents.analyzer import parse_failure
from agents.fixer import generate_fix

from agents.validator import validate_fix
from agents.reporter import report_result
from core.context_builder import build_context


def run_orchestrator(raw_failure_output: str):
    print("--- Starting Orchestrator ---")
    
    failure = parse_failure(raw_failure_output)
    if not failure:
        print("Could not parse failure.")
        return
        
    print(f"Parsed Failure: {failure.to_dict()}")

    max_attempts = 3
    success = False
    
    for attempt in range(1, max_attempts + 1):
        print(f"\n[Attempt {attempt}/{max_attempts}]")
        
        context = build_context(failure)
        
        fix = generate_fix(context, failure)
        print(f"Generated Fix:\n{fix}\n")
        
        is_valid = validate_fix(fix, failure)
        
        report_result(attempt, is_valid, fix)
        
        if is_valid:
            print(f"✅ Fix validated successfully on attempt {attempt}.")
            success = True
            break
        else:
            print("❌ Validation failed.")
            
    if not success:
        print("\nFailed to generate a valid fix after 3 attempts.")

if __name__ == "__main__":
    try:
        from fixtures import get_fixtures
        fixtures = get_fixtures()
        
        print(f"Running orchestrator against {len(fixtures)} fixtures...\n")
        for i, raw_fail in enumerate(fixtures, 1):
            print(f"=== Fixture {i} ===")
            run_orchestrator(raw_fail)
            print("="*40 + "\n")
    except ImportError:
        print("fixtures.py not found. Provide input manually or create backend/fixtures.py.")
