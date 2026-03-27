from langgraph.graph import StateGraph, START, END
from typing import TypedDict, List
import agents.analyzer as analyzer
import agents.fixer as fixer
import agents.validator as validator
import agents.reporter as reporter
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
