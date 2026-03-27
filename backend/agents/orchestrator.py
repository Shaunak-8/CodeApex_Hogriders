from langgraph.graph import StateGraph, START, END
from typing import TypedDict, List
import agents.analyzer as analyzer
import agents.fixer as fixer
import agents.validator as validator
import agents.reporter as reporter
import sys
import os

class AgentState(TypedDict):
    failures: List[dict]
    ledger: dict
    fixes_applied: List[dict]
    iteration: int
    run_id: str

class OrchestratorAgent:
    def __init__(self):
        self.analyzer = analyzer.AnalyzerAgent()
        self.router = fixer.FixerRouter()
        self.validator = validator.ValidatorAgent()
        self.reporter = reporter.ReporterAgent()
        
        workflow = StateGraph(AgentState)
        
        workflow.add_node("analyze", self.analyze_node)
        workflow.add_node("fix", self.fix_node)
        workflow.add_node("validate", self.validate_node)
        workflow.add_node("report", self.report_node)
        
        workflow.add_edge(START, "analyze")
        workflow.add_edge("analyze", "fix")
        workflow.add_edge("fix", "validate")
        workflow.add_edge("validate", "report")
        workflow.add_edge("report", END)
        
        self.app = workflow.compile()
        
    def analyze_node(self, state: AgentState):
        state["failures"] = self.analyzer.run("mock_path")
        return state
        
    def fix_node(self, state: AgentState):
        if state["failures"]:
            f = state["failures"][0]
            AgentClass = self.router.route(f["bug_type"])
            agent = AgentClass(None, None, None)
            fix_res = agent.fix(f, {})
            state["fixes_applied"].append(fix_res)
        return state
        
    def validate_node(self, state: AgentState):
        self.validator.validate("mock_path", {}, {})
        return state
        
    def report_node(self, state: AgentState):
        self.reporter.build_results({"run_id": state["run_id"], "commits": len(state["fixes_applied"])})
        return state

    def run(self, run_id: str):
        initial_state = {
            "failures": [],
            "ledger": {},
            "fixes_applied": [],
            "iteration": 0,
            "run_id": run_id
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
