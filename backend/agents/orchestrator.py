from langgraph.graph import StateGraph, START, END
from typing import TypedDict, List
import agents.analyzer as analyzer
import agents.fixer as fixer
import agents.validator as validator
import agents.reporter as reporter
import sys
import os
import json
import time
from agents.analyzer import AnalyzerAgent
from agents.fixer import FixerRouter
from agents.validator import ValidatorAgent
from agents.reporter import ReporterAgent
from agents.memory import MemoryAgent
from core.dependency_graph import DependencyGraph
from core.failure_ledger import FailureLedger
from core.confidence import calculate as calc_confidence
from core.context_builder import ContextBuilder
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
    causal_graph: Optional[dict]
    health_before: int
    health_after: int

class OrchestratorAgent:
    def __init__(self):
        self.analyzer = AnalyzerAgent()
        self.router = FixerRouter()
        self.validator = ValidatorAgent()
        self.reporter = ReporterAgent()
        self.memory = MemoryAgent()
        self.dep_graph = DependencyGraph()
        self.ledger = FailureLedger()
        self.context_builder = ContextBuilder()
        
        self.groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        
        workflow = StateGraph(AgentState)
        workflow.add_node("analyze", self.analyze_node)
        workflow.add_node("fix", self.fix_node)
        workflow.add_node("validate", self.validate_node)
        workflow.add_node("report", self.report_node)
        
        workflow.add_edge(START, "analyze")
        workflow.add_conditional_edges("analyze", self.should_fix, {"continue": "fix", "end": "report"})
        workflow.add_edge("fix", "validate")
        workflow.add_conditional_edges("validate", self.should_retry, {"retry": "analyze", "end": "report"})
        workflow.add_edge("report", END)
        
        self.app = workflow.compile()

    def analyze_node(self, state: AgentState):
        run_id = state["run_id"]
        emit(run_id, "OrchestratorAgent", "Starting analysis phase...", "ANALYSIS_STARTED")
        
        failures = self.analyzer.run(state["repo_path"])
        state["failures"] = failures
        
        # Health score (before) = 100 - (failures * 5), capped at 0
        state["health_before"] = max(0, 100 - len(failures) * 5)
        
        if failures:
            emit(run_id, "AnalyzerAgent", f"Detected {len(failures)} failures.", "FAILURE_DETECTED")
            
            # Build dependency graph
            self.dep_graph.build_from_failures(failures, state["repo_path"])
            graph_data = self.dep_graph.to_dict()
            
            # Annotate nodes with status
            graph_data["nodes"] = [{"id": n, "status": "failing"} for n in graph_data["nodes"]]
            state["causal_graph"] = graph_data
            
            root_nodes = self.dep_graph.get_root_nodes()
            emit(run_id, "OrchestratorAgent", f"Built dependency graph. Root cause nodes: {root_nodes}", "GRAPH_BUILT")
        else:
            emit(run_id, "AnalyzerAgent", "No failures detected.", "ANALYSIS_COMPLETED")
            
        return state

    def should_fix(self, state: AgentState):
        return "end" if not state["failures"] else "continue"

    def fix_node(self, state: AgentState):
        run_id = state["run_id"]
        repo_path = state["repo_path"]
        
        # Sort by root cause: fix root nodes first
        root_nodes = set(self.dep_graph.get_root_nodes())
        sorted_failures = sorted(state["failures"], key=lambda f: 0 if f["file"] in root_nodes else 1)
        
        for failure in sorted_failures:
            file_key = failure["file"]
            bug_type = failure["bug_type"]
            strategy = f"{bug_type}:{failure.get('error_message', '')[:50]}"
            
            # Check ledger — skip if already tried
            if self.ledger.was_tried(file_key, strategy):
                emit(run_id, "MemoryAgent", f"Skipping {file_key} — strategy already tried.", "FIX_ROUTED")
                continue
            
            emit(run_id, "OrchestratorAgent", f"Routing {bug_type} in {file_key}...", "FIX_ROUTED")
            
            AgentClass = self.router.route(bug_type)
            agent = AgentClass(self.groq_client, self.context_builder)
            
            # Memory history
            history = self.memory.get_context(file_key, failure.get("line", 0))
            
            # Blast radius
            try:
                blast = self.dep_graph.get_blast_radius(file_key)
            except ValueError:
                blast = 1
            
            fix_res = agent.fix(failure, repo_path, history)
            
            if fix_res and fix_res.get("fixed_code"):
                # Apply fix
                full_path = os.path.join(repo_path, file_key)
                try:
                    with open(full_path, "r") as f:
                        before_code = f.read()
                except Exception:
                    before_code = ""
                    
                with open(full_path, "w") as f:
                    f.write(fix_res["fixed_code"])
                
                # Confidence
                conf = calc_confidence({
                    "bug_type": bug_type,
                    "lines_changed": abs(len(fix_res["fixed_code"].splitlines()) - len(before_code.splitlines())),
                    "blast_radius": blast,
                    "touches_imports": "import" in fix_res["fixed_code"][:200],
                })
                
                fix_entry = {
                    "file": file_key,
                    "bug_type": bug_type,
                    "agent": agent.specialty,
                    "explanation": fix_res.get("explanation", ""),
                    "confidence": conf["score"],
                    "blast_radius": blast,
                    "status": "applied",
                    "before_code": before_code[:500],
                    "fixed_code": fix_res["fixed_code"][:500],
                }
                state["fixes_applied"].append(fix_entry)
                
                # Record in ledger and memory
                self.ledger.add_attempt(file_key, strategy, "applied")
                self.memory.record(file_key, failure.get("line", 0), strategy, "applied")
                
                emit(run_id, agent.specialty + "Agent", 
                     json.dumps(fix_entry),
                     "FIX_APPLIED")
            else:
                self.ledger.add_attempt(file_key, strategy, "failed")
                emit(run_id, "OrchestratorAgent", f"Failed to generate fix for {file_key}", "FIX_FAILED")
                
        return state

    def validate_node(self, state: AgentState):
        run_id = state["run_id"]
        emit(run_id, "ValidatorAgent", "Validating fixes...", "VALIDATION_STARTED")
        
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
        
        # Git commit and push
        try:
            from tools.git_ops import commit_and_push_all
            branch_name = f"{state['team_name']}_{state['leader_name']}_AI_Fix"
            commit_and_push_all(state["repo_path"], "[AI-AGENT] Applied autonomous fixes", branch_name)
            emit(run_id, "GitAgent", f"Pushed fixes to branch {branch_name}", "COMMIT_DONE")
        except Exception as e:
            emit(run_id, "GitAgent", f"Git push failed: {str(e)}", "COMMIT_FAILED")

        # Health after
        state["health_after"] = max(0, 100 - (len(state["failures"]) - len(state["fixes_applied"])) * 5)
        
        # Update causal graph status
        fixed_files = {f["file"] for f in state["fixes_applied"]}
        if state.get("causal_graph"):
            for node in state["causal_graph"].get("nodes", []):
                if node["id"] in fixed_files:
                    node["status"] = "fixed"

        results = self.reporter.build_results(
            run_id=run_id,
            repo_url=state["repo_url"],
            final_status=state["status"],
            iterations=state["iteration"] + 1,
            failures_log=state["failures"],
            fixes=state["fixes_applied"],
            health_score={"before": state.get("health_before", 0), "after": state.get("health_after", 0)},
            causal_graph=state.get("causal_graph", {"nodes": [], "edges": []}),
        )
        state["results"] = results
        
        # Emit final result as JSON for frontend to parse
        emit(run_id, "OrchestratorAgent", json.dumps(results), "RUN_COMPLETED")
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
            "results": None,
            "causal_graph": None,
            "health_before": 0,
            "health_after": 0,
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
