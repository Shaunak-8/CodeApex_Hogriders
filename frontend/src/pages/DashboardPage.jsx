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
import { Activity, Brain, Loader, X, Layout, Search, Command, Shield, Zap, Globe, Terminal, Network } from 'lucide-react';
import { getRootCauseAnalysis, getProjects, getProject } from '../lib/api';

export default function DashboardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  
  const status = useAgentStore(s => s.status);
  const runId = useAgentStore(s => s.runId);
  const setStatus = useAgentStore(s => s.setStatus);
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

  // Sync project details on load or ID change
  useEffect(() => {
    async function syncProject() {
      if (!id || !session?.access_token) return;
      
      const state = useAgentStore.getState();
      
      // If project changed, do a full reset
      if (state.projectId !== id) {
        state.reset();
        state.setProjectId(id);
      }
      
      // Fetch project metadata if missing
      if (!state.repoUrl || state.projectId !== id) {
        try {
          // Attempt specific project fetch first (more efficient)
          const project = await getProject(id);
          if (project) {
            state.setRepoUrl(project.repo_url);
          } else {
            // Fallback to bulk projects if specific fetch fails
            const data = await getProjects();
            const p = data.projects?.find(proj => proj.id === id);
            if (p) state.setRepoUrl(p.repo_url);
          }
        } catch (e) {
          console.error("Failed to sync project:", e);
        }
      }
    }
    syncProject();
  }, [id, session, setProjectId]);

  useEffect(() => {
    if (!runId) setStatus('idle');
  }, [id, runId, setStatus]);

  const handleRCA = async () => {
    if (!thoughts.length) return;
    setRcaLoading(true);
    try {
      const errorLogs = thoughts.filter(t => t.type === 'error').map(t => t.message).join('\n');
      const data = await getRootCauseAnalysis(id, errorLogs || "Manual Analysis Requested");
      setRcaData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setRcaLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.gridOverlay}></div>

      <header style={styles.header}>
        <div style={styles.titleSection}>
          <div style={styles.eyebrow}>
            <div style={styles.dot}></div>
            <span style={styles.eyebrowText}>AUTONOMOUS_HEALING_PROTOCOL_ACTIVE</span>
          </div>
          <h1 style={styles.title}>NODE_CONTROL // {repoUrl?.split('/').pop().replace('.git', '').toUpperCase() || 'PROJECT_' + (id ? id.substring(0,8) : '00000000')}</h1>
          <p style={styles.sub}>{repoUrl?.replace('https://github.com/', 'UPLINK://')}</p>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.btnGroup}>
            <button style={styles.secBtn} onClick={() => navigate(`/app/project/${id}/infra`)}>
              <Zap size={14} /> <span>INFRA_CONTROL</span>
            </button>
            <button style={styles.secBtn} onClick={() => navigate(`/app/project/${id}/graph`)}>
              <Globe size={14} /> <span>REPO_SCAN</span>
            </button>
            <button style={styles.primaryBtn} onClick={() => navigate(`/app/workspace/${id}`)}>
              <Command size={14} /> <span>AI_WORKSPACE</span>
            </button>
          </div>
          <StatusBadge status={status} />
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.grid}>
          <div style={styles.leftCol}>
            <div style={styles.section}>
                <div style={styles.sectionHeader}>
                    <Search size={14} color="var(--green)" />
                    <span style={styles.sectionTitle}>INTEGRITY_SCANNER</span>
                </div>
                <InputPanel onRun={startRun} status={status} />
            </div>

            <div style={styles.section}>
                <div style={styles.sectionHeader}>
                    <Activity size={14} color="var(--cyan)" />
                    <span style={styles.sectionTitle}>SESSION_METRICS</span>
                </div>
                <RunSummaryCard status={status} totalFailures={totalFailures} totalFixes={totalFixes} score={score} />
            </div>

            <div style={styles.section}>
                <div style={styles.sectionHeader}>
                    <Shield size={14} color="var(--green)" />
                    <span style={styles.sectionTitle}>CORE_STABILITY</span>
                </div>
                <RepoHealthScore healthScore={healthScore} />
                <ScoreBreakdown score={score} />
            </div>
            
            <button 
              style={{...styles.rcaBtn, opacity: thoughts.length ? 1 : 0.5}} 
              onClick={handleRCA}
              disabled={rcaLoading || !thoughts.length}
            >
              {rcaLoading ? <Loader size={12} className="spin" /> : <Brain size={14} />}
              <span>POST_MORTEM_ANALYSIS</span>
            </button>
          </div>

          <div style={styles.centerCol}>
            {rcaData && (
                <div style={styles.rcaPanel}>
                    <div style={styles.rcaHeader}>
                        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                            <Brain size={16} color="var(--green)" />
                            <span style={{fontWeight: 800, letterSpacing: 2}}>AI_POST_MORTEM_DECRYPTED</span>
                        </div>
                        <button style={styles.closeBtn} onClick={() => setRcaData(null)}><X size={14}/></button>
                    </div>
                    <div style={styles.rcaBody}>
                        <div style={styles.rcaSec}>
                            <h4 style={styles.rcaLabel}>ROOT_CAUSE_IDENTIFIED:</h4>
                            <p style={styles.rcaText}>{(rcaData?.root_cause || 'ANALYSIS_PENDING').toUpperCase()}</p>
                        </div>
                        <div style={styles.rcaSec}>
                            <h4 style={styles.rcaLabel}>LONG_TERM_RECOVERY_PROTOCOL:</h4>
                            <p style={styles.rcaText}>{(rcaData?.long_term_fix || 'STABILIZATION_REQUIRED').toUpperCase()}</p>
                        </div>
                    </div>
                </div>
            )}
            <div style={styles.section}>
                <div style={styles.sectionHeader}>
                    <Terminal size={14} color="var(--green)" />
                    <span style={styles.sectionTitle}>THOUGHT_STREAM_DECRYPTED</span>
                </div>
                <AgentThoughtStream thoughts={thoughts} />
            </div>
            <div style={styles.section}>
                <div style={styles.sectionHeader}>
                    <Layout size={14} color="var(--cyan)" />
                    <span style={styles.sectionTitle}>PATCH_REGISTRY</span>
                </div>
                <FixesTable fixes={fixes} />
            </div>
          </div>

          <div style={styles.rightCol}>
            <div style={styles.section}>
                <div style={styles.sectionHeader}>
                    <Activity size={14} color="var(--green)" />
                    <span style={styles.sectionTitle}>ORCHESTRATION_TIMELINE</span>
                </div>
                <CICDTimeline thoughts={thoughts} />
            </div>
            <div style={styles.graphCard}>
              <div style={styles.sectionHeader}>
                <Network size={14} color="var(--cyan)" />
                <span style={styles.sectionTitle}>CAUSALITY_DAG</span>
              </div>
              <CausalityGraph graph={causalGraph} />
            </div>
          </div>
        </div>
      </main>
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const styles = {
  page: { padding: '40px 60px', minHeight: '100vh', position: 'relative', overflowX: 'hidden' },
  gridOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundSize: '100px 100px', backgroundImage: 'linear-gradient(rgba(30, 30, 46, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 30, 46, 0.05) 1px, transparent 1px)', pointerEvents: 'none', zIndex: 0 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48, position: 'relative', zIndex: 10 },
  titleSection: { flex: 1 },
  eyebrow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  dot: { width: 6, height: 6, background: 'var(--green)', boxShadow: '0 0 8px var(--green)', borderRadius: '1px' },
  eyebrowText: { fontSize: 9, fontWeight: 800, letterSpacing: 2, color: 'var(--green)', opacity: 0.8 },
  title: { fontSize: 32, fontWeight: 800, letterSpacing: 2, marginBottom: 4 },
  sub: { fontSize: 10, color: 'var(--text-secondary)', fontFamily: "var(--font-mono)", letterSpacing: 1, opacity: 0.8 },
  headerRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16 },
  btnGroup: { display: 'flex', gap: 12 },
  primaryBtn: { padding: '10px 20px', background: 'var(--green)', color: '#000', border: 'none', borderRadius: 2, fontWeight: 800, cursor: 'pointer', fontSize: 10, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 10 },
  secBtn: { padding: '10px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 2, fontWeight: 700, cursor: 'pointer', fontSize: 10, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 10, transition: '0.3s' },
  main: { position: 'relative', zIndex: 5 },
  grid: { display: 'grid', gridTemplateColumns: '320px 1fr 340px', gap: 32 },
  leftCol: { display: 'flex', flexDirection: 'column', gap: 32 },
  centerCol: { display: 'flex', flexDirection: 'column', gap: 32 },
  rightCol: { display: 'flex', flexDirection: 'column', gap: 32 },
  section: { display: 'flex', flexDirection: 'column', gap: 20 },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 12, borderLeft: '2px solid var(--border)', paddingLeft: 16 },
  sectionTitle: { fontSize: 10, letterSpacing: 2, color: 'var(--text-secondary)', fontWeight: 800, fontFamily: "var(--font-mono)" },
  rcaBtn: { padding: '16px', background: 'rgba(0, 255, 136, 0.05)', border: '1px solid rgba(0, 255, 136, 0.2)', color: 'var(--green)', borderRadius: 2, fontSize: 10, fontWeight: 800, letterSpacing: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, transition: '0.3s' },
  rcaPanel: { background: 'rgba(0, 255, 136, 0.03)', border: '1px solid rgba(0, 255, 136, 0.2)', borderRadius: 2, marginBottom: 32, overflow: 'hidden' },
  rcaHeader: { padding: '16px 20px', borderBottom: '1px solid rgba(0, 255, 136, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' },
  rcaBody: { padding: 24, display: 'flex', flexDirection: 'column', gap: 24 },
  rcaSec: { display: 'flex', flexDirection: 'column', gap: 8 },
  rcaLabel: { fontSize: 9, fontWeight: 800, color: 'var(--green)', opacity: 0.9, fontFamily: "var(--font-mono)", letterSpacing: 1 },
  rcaText: { fontSize: 13, color: '#fff', lineHeight: 1.6, fontFamily: "var(--font-code)", letterSpacing: 0.5 },
  graphCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 },
};

