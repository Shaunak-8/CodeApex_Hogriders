from langgraph.graph import StateGraph, START, END
from typing import TypedDict, List
import sys
import os
import logging

logger = logging.getLogger(__name__)

try:
    import agents.analyzer as analyzer
    import agents.fixer as fixer
    import agents.validator as validator
    import agents.reporter as reporter
except ImportError:
    analyzer = None
    fixer = None
    validator = None
    reporter = None

from sqlalchemy.orm import Session
from db import crud
import tools.git_ops as git_ops

class AgentState(TypedDict):
    failures: List[dict]
    ledger: dict
    fixes_applied: List[dict]
    iteration: int
    run_id: str
    repo_url: str
    branch_name: str
    db_iteration_id: int

class OrchestratorAgent:
    def __init__(self, db: Session = None):
        self.analyzer = None
        self.router = None
        self.validator = None
        self.reporter = None
        
        try:
            self.analyzer = analyzer.AnalyzerAgent() if analyzer else None
            self.router = fixer.FixerRouter() if fixer else None
            self.validator = validator.ValidatorAgent() if validator else None
            self.reporter = reporter.ReporterAgent() if reporter else None
        except Exception as e:
            logger.warning("Could not initialize agent components: %s", e)
            
        self.db = db
        
        workflow = StateGraph(AgentState)
        
        workflow.add_node("clone", self.clone_node)
        workflow.add_node("analyze", self.analyze_node)
        workflow.add_node("fix", self.fix_node)
        workflow.add_node("validate", self.validate_node)
        workflow.add_node("report", self.report_node)
        
        workflow.add_edge(START, "clone")
        workflow.add_edge("clone", "analyze")
        workflow.add_edge("analyze", "fix")
        workflow.add_edge("fix", "validate")
        workflow.add_edge("validate", "report")
        workflow.add_edge("report", END)
        
        self.app = workflow.compile()
        
    def clone_node(self, state: AgentState):
        if self.db:
            crud.update_run(self.db, run_id=state["run_id"], status="cloning repo")
            
        repo_path = os.path.join(os.getcwd(), "workspaces", f"run_{state['run_id']}")
        try:
            repo = git_ops.clone_repo(state["repo_url"], repo_path)
            git_ops.create_branch(repo, state["branch_name"])
            state["ledger"]["repo_path"] = repo_path
        except Exception as e:
            logger.exception("Git clone failed for run %s: %s", state["run_id"], e)
            state["ledger"]["clone_error"] = str(e)
            state["ledger"]["clone_failed"] = True
            if self.db:
                crud.update_run(self.db, run_id=state["run_id"], status="failed", memory={"error": f"Git Pull Failed: {str(e)}"})
        return state

    def analyze_node(self, state: AgentState):
        if state["ledger"].get("clone_failed"):
            return state
            
        state["iteration"] += 1
        
        if self.db:
            iteration = crud.create_iteration(self.db, run_id=state["run_id"], iteration_number=state["iteration"])
            state["db_iteration_id"] = iteration.id
            crud.update_iteration(self.db, iteration_id=state["db_iteration_id"], status="analyzing")

        repo_path = state["ledger"].get("repo_path", "mock_path")
        if self.analyzer:
            state["failures"] = self.analyzer.run(repo_path)
        else:
            state["failures"] = [{"bug_type": "LINTING", "file": "src/main.py", "message": "Mock analysis"}]
        return state
        
    def fix_node(self, state: AgentState):
        if state["ledger"].get("clone_failed"):
            return state
            
        if state["failures"] and self.router:
            f = state["failures"][0]
            try:
                AgentClass = self.router.route(f.get("bug_type", "LINTING"))
                agent = AgentClass(None, None, None)
                fix_res = agent.fix(f, {})
                state["fixes_applied"].append(fix_res)
                
                if self.db and state.get("db_iteration_id"):
                    crud.create_fix(
                        db=self.db,
                        run_id=state["run_id"],
                        iteration_id=state["db_iteration_id"],
                        file_path=fix_res.get("file", "unknown_file.py"),
                        bug_type=f.get("bug_type", "UNKNOWN"),
                        commit_message=fix_res.get("message", "Applied fix"),
                        status="applied"
                    )
            except Exception as e:
                logger.exception("Fix failed for run %s: %s", state["run_id"], e)
        return state
        
    def validate_node(self, state: AgentState):
        if state["ledger"].get("clone_failed"):
            return state
            
        repo_path = state["ledger"].get("repo_path", "mock_path")
        validation_passed = False
        if self.validator:
            try:
                self.validator.validate(repo_path, {}, {})
                validation_passed = True
            except Exception as e:
                logger.exception("Validation failed for run %s: %s", state["run_id"], e)
                validation_passed = False
        else:
            # Mock: pass if fixes were applied
            validation_passed = len(state["fixes_applied"]) > 0
            
        if self.db and state.get("db_iteration_id"):
            status_val = "pass" if validation_passed else "fail"
            crud.update_iteration(self.db, iteration_id=state["db_iteration_id"], status=status_val, logs="Validation complete")
        return state
        
    def report_node(self, state: AgentState):
        if state["ledger"].get("clone_failed"):
            return state
            
        if self.reporter:
            self.reporter.build_results({"run_id": state["run_id"], "commits": len(state["fixes_applied"])})
            
        if self.db:
            score = 100.0 if not state["failures"] else max(0.0, 100.0 - (len(state["failures"]) * 10))
            status = "completed" if not state["failures"] else "failed"
            crud.update_run(
                self.db, 
                run_id=state["run_id"], 
                status=status, 
                overall_score=score,
                memory={"fixes_count": len(state["fixes_applied"]), "ledger": state["ledger"]}
            )
        return state

    def run(self, run_id: str, repo_url: str = "mock_repo", branch_name: str = "main"):
        initial_state = {
            "failures": [],
            "ledger": {},
            "fixes_applied": [],
            "iteration": 0,
            "run_id": run_id,
            "repo_url": repo_url,
            "branch_name": branch_name,
            "db_iteration_id": 0
        }
        return self.app.invoke(initial_state)

# --- SIMPLE HACKATHON ORCHESTRATOR implementation below ---

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

try:
    from agents.analyzer import parse_failure
    from agents.fixer import generate_fix
    from agents.validator import validate_fix
    from agents.reporter import report_result
    from core.context_builder import build_context
except ImportError:
    pass

def run_orchestrator(raw_failure_output: str):
    print("--- Starting Orchestrator ---")
    try:
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
    except Exception as e:
        print(f"Error running orchestrator: {e}")

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
