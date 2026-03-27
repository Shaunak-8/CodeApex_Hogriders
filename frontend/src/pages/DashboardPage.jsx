import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAgentStore } from '../store/agentStore';
import { useAgentRun } from '../hooks/useAgentRun';
import { useAgentSSE } from '../hooks/useAgentSSE';
import { useAuth } from '../hooks/useAuth';

import InputPanel from '../components/InputPanel';
import AgentThoughtStream from '../components/AgentThoughtStream';
import FixesTable from '../components/FixesTable';
import RunSummaryCard from '../components/RunSummaryCard';
import ScoreBreakdown from '../components/ScoreBreakdown';
import CICDTimeline from '../components/CICDTimeline';
import RepoHealthScore from '../components/RepoHealthScore';
import CausalityGraph from '../components/CausalityGraph';
import StatusBadge from '../components/StatusBadge';
import { Activity, Brain, Loader, X } from 'lucide-react';
import { getRootCauseAnalysis } from '../lib/api';

export default function DashboardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  
  const status = useAgentStore(s => s.status);
  const runId = useAgentStore(s => s.runId);
  const setStatus = useAgentStore(s => s.setStatus);
  const projectId = useAgentStore(s => s.projectId);
  const setProjectId = useAgentStore(s => s.setProjectId);
  const repoUrl = useAgentStore(s => s.repoUrl);
  const thoughts = useAgentStore(s => s.thoughts);
  const fixes = useAgentStore(s => s.fixes);
  const score = useAgentStore(s => s.score);
  const healthScore = useAgentStore(s => s.healthScore);
  const causalGraph = useAgentStore(s => s.causalGraph);
  const totalFailures = useAgentStore(s => s.totalFailures);
  const totalFixes = useAgentStore(s => s.totalFixes);

  const [rcaData, setRcaData] = useState(null);
  const [rcaLoading, setRcaLoading] = useState(false);

  const { startRun } = useAgentRun();
  useAgentSSE(runId);

  // Ensure the store knows which project we're on (important if user deep-links / refreshes)
  useEffect(() => {
    if (id && projectId !== id) setProjectId(id);
  }, [id, projectId, setProjectId]);

  // If user navigates back to the dashboard with no active run,
  // don't keep showing a stale FAILED badge from a previous session.
  useEffect(() => {
    if (!runId) setStatus('idle');
  }, [id, runId, setStatus]);

  const handleRCA = async () => {
    if (!thoughts.length) return;
    setRcaLoading(true);
    try {
      const errorLogs = thoughts.filter(t => t.type === 'error').map(t => t.message).join('\n');
      const data = await getRootCauseAnalysis(errorLogs || "Manual Analysis Requested");
      setRcaData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setRcaLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Pipeline Dashboard</h1>
          <p style={styles.sub}>{repoUrl?.replace('https://github.com/', '') || 'Project ' + id}</p>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.infraBtn} onClick={() => navigate(`/app/project/${id}/infra`)}>
            Infra Assistant
          </button>
          <button style={styles.vizBtn} onClick={() => navigate(`/app/project/${id}/graph`)}>
            Repo Visualizer
          </button>
          <button style={styles.workspaceBtn} onClick={() => navigate(`/app/workspace/${id}`)}>
            AI Workspace
          </button>
          <StatusBadge status={status} />
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.grid}>
          {/* Left Column */}
          <div style={styles.leftCol}>
            <InputPanel onRun={startRun} status={status} />
            <RunSummaryCard status={status} totalFailures={totalFailures} totalFixes={totalFixes} score={score} />
            <RepoHealthScore healthScore={healthScore} />
            <ScoreBreakdown score={score} />
            
            <button 
              style={{...styles.rcaBtn, opacity: thoughts.length ? 1 : 0.5}} 
              onClick={handleRCA}
              disabled={rcaLoading || !thoughts.length}
            >
              {rcaLoading ? <Loader size={12} className="spin" /> : <Brain size={12} />}
              AI Root Cause Analysis
            </button>
          </div>

          {/* Center Column */}
          <div style={styles.centerCol}>
            {rcaData && (
                <div style={styles.rcaPanel}>
                    <div style={styles.rcaHeader}>
                        <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                            <Brain size={16} color="#00ff88" />
                            <span style={{fontWeight: 700, letterSpacing: 1}}>AI POST-MORTEM</span>
                        </div>
                        <button style={styles.closeBtn} onClick={() => setRcaData(null)}><X size={14}/></button>
                    </div>
                    <div style={styles.rcaBody}>
                        <div style={styles.rcaSection}>
                            <h4 style={styles.rcaLabel}>ROOT CAUSE</h4>
                            <p style={styles.rcaText}>{rcaData.root_cause}</p>
                        </div>
                        <div style={styles.rcaSection}>
                            <h4 style={styles.rcaLabel}>LONG-TERM FIX</h4>
                            <p style={styles.rcaText}>{rcaData.long_term_fix}</p>
                        </div>
                    </div>
                </div>
            )}
            <AgentThoughtStream thoughts={thoughts} />
            <FixesTable fixes={fixes} />
          </div>

          {/* Right Column */}
          <div style={styles.rightCol}>
            <CICDTimeline thoughts={thoughts} />
            <div style={styles.card}>
              <h3 style={styles.cardTitle}><Activity size={14} color="#00ccff" /> CAUSALITY DAG</h3>
              <CausalityGraph graph={causalGraph} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  page: { padding: '32px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  title: { fontSize: 24, fontWeight: 800, letterSpacing: 1, marginBottom: 8 },
  sub: { fontSize: 13, color: '#888', fontFamily: "'JetBrains Mono', monospace" },
  headerRight: { display: 'flex', alignItems: 'center', gap: 14 },
  workspaceBtn: { padding: '8px 16px', background: 'linear-gradient(135deg, #00ff88, #00ccff)', border: 'none', color: '#000', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 12 },
  vizBtn: { padding: '8px 16px', background: 'transparent', border: '1px solid #1e1e2e', color: '#fff', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 12 },
  infraBtn: { padding: '8px 16px', background: 'transparent', border: '1px solid #1e1e2e', color: '#fff', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 12 },

  rcaBtn: { marginTop: 16, padding: '12px', background: '#111118', border: '1px solid #1e1e2e', color: '#00ff88', borderRadius: 12, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: '0.2s', ':hover': { borderColor: '#00ff88' } },

  rcaPanel: { background: '#00ff8808', border: '1px solid #00ff8833', borderRadius: 16, marginBottom: 16, overflow: 'hidden' },
  rcaHeader: { padding: '12px 16px', borderBottom: '1px solid #00ff8822', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 },
  closeBtn: { background: 'none', border: 'none', color: '#555', cursor: 'pointer' },
  rcaBody: { padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
  rcaSection: { display: 'flex', flexDirection: 'column', gap: 4 },
  rcaLabel: { fontSize: 9, fontWeight: 800, color: '#00ff88', letterSpacing: 1 },
  rcaText: { fontSize: 12, color: '#fff', lineHeight: 1.6, fontFamily: "'JetBrains Mono', monospace" },

  main: { maxWidth: 1500, margin: '0 auto', padding: '24px' },
  grid: { display: 'grid', gridTemplateColumns: '300px 1fr 340px', gap: 20 },
  leftCol: { display: 'flex', flexDirection: 'column', gap: 16 },
  centerCol: { display: 'flex', flexDirection: 'column', gap: 16 },
  rightCol: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: { background: '#111118', border: '1px solid #1e1e2e', borderRadius: 16, padding: 20 },
  cardTitle: { fontSize: 11, color: '#555', letterSpacing: 2, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
};

