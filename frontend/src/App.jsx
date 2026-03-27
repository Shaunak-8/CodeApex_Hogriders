import { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useAgentStore } from './store/agentStore';
import { useAgentRun } from './hooks/useAgentRun';
import { useAgentSSE } from './hooks/useAgentSSE';

import AuthModal from './components/AuthModal';
import UserAvatar from './components/UserAvatar';
import CausalityGraph from './components/CausalityGraph';
import ScoreCharts from './components/ScoreCharts';
import Timeline from './components/Timeline';
import DiffViewer from './components/DiffViewer';
import { Activity, Shield, Zap, Target, Bug, Layers } from 'lucide-react';

function App() {
  const { user, loading, initialize } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  
  const repoUrl = useAgentStore((s) => s.repoUrl);
  const setRepoUrl = useAgentStore((s) => s.setRepoUrl);
  const teamName = useAgentStore((s) => s.teamName);
  const setTeamName = useAgentStore((s) => s.setTeamName);
  const leaderName = useAgentStore((s) => s.leaderName);
  const setLeaderName = useAgentStore((s) => s.setLeaderName);
  
  const status = useAgentStore((s) => s.status);
  const runId = useAgentStore((s) => s.runId);
  const thoughts = useAgentStore((s) => s.thoughts);
  const fixes = useAgentStore((s) => s.fixes);
  const score = useAgentStore((s) => s.score);
  const healthScore = useAgentStore((s) => s.healthScore);
  const causalGraph = useAgentStore((s) => s.causalGraph);
  
  const { startRun } = useAgentRun();
  useAgentSSE(runId);

  useEffect(() => { initialize(); }, []);

  if (loading) return <div style={styles.loadingScreen}><div style={styles.spinner}></div></div>;

  return (
    <div style={styles.app}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logoGlow}></div>
          <h1 style={styles.logo}>HOGRIDERS</h1>
          <span style={styles.badge}>CI/CD AGENT</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user ? <UserAvatar /> : <button style={styles.loginBtn} onClick={() => setShowAuth(true)}>SIGN IN</button>}
        </div>
      </header>

      {/* Main Dashboard */}
      <main style={styles.main}>
        {!user ? (
          <div style={styles.hero}>
            <h2 style={styles.heroTitle}>PRODUCTION-READY AUTONOMOUS HEALING</h2>
            <p style={styles.heroSub}>
              Multi-Agent CI/CD system powered by Groq Llama3-70B. Detect, analyze, and fix in real-time.
            </p>
            <button style={styles.heroBtn} onClick={() => setShowAuth(true)}>INITIALIZE ACCESS</button>
          </div>
        ) : (
          <div style={styles.dashboardGrid}>
            
            {/* Left Column: Input + Stats */}
            <div style={styles.leftCol}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}><Zap size={14} color="#00ff88" /> RUN AGENT</h3>
                <input
                  type="text"
                  placeholder="GitHub Repository URL..."
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  style={styles.repoInput}
                />
                <button
                  onClick={startRun}
                  disabled={status === 'running' || !repoUrl}
                  style={{ ...styles.runBtn, ...(status === 'running' ? styles.runBtnRunning : {}) }}
                >
                  {status === 'running' ? 'AGENT ACTIVE...' : 'EXECUTE PIPELINE'}
                </button>
              </div>

              <div style={styles.card}>
                <h3 style={styles.cardTitle}><Activity size={14} color="#00ccff" /> SYSTEM STATUS</h3>
                <div style={styles.statusBox}>
                   <div style={{ ...styles.dot, background: status === 'passed' ? '#00ff88' : status === 'running' ? '#ffaa00' : '#333' }}></div>
                   <span style={styles.statusText}>{status.toUpperCase()}</span>
                </div>
                <div style={styles.metricsGrid}>
                  <div style={styles.metric}>
                    <span style={styles.metricLabel}>HEALTH</span>
                    <span style={{ ...styles.metricValue, color: '#00ff88' }}>{healthScore.after}%</span>
                  </div>
                  <div style={styles.metric}>
                    <span style={styles.metricLabel}>SCORE</span>
                    <span style={styles.metricValue}>{score.total}</span>
                  </div>
                </div>
              </div>

              <ScoreCharts score={score} healthScore={healthScore} />

              <div style={styles.card}>
                 <h3 style={styles.cardTitle}><Shield size={14} color="#ff3b3b" /> CAUSALITY DAG</h3>
                 <CausalityGraph graph={causalGraph} />
              </div>
            </div>

            {/* Right Column: Thought Stream & Fixes */}
            <div style={styles.rightCol}>
              <Timeline thoughts={thoughts} />

              <div style={{ ...styles.card, marginTop: 24 }}>
                <h3 style={styles.cardTitle}><Bug size={14} color="#ffaa00" /> RECENT FIXES</h3>
                <div style={styles.fixesList}>
                  {fixes.length === 0 && <p style={styles.muted}>No fixes applied yet.</p>}
                  {fixes.map((f, i) => (
                    <div key={i} style={styles.fixItem}>
                       <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={styles.fixFile}>{f.file}</span>
                          <span style={styles.fixBadge}>{f.bug_type}</span>
                       </div>
                       <p style={styles.fixMsg}>{f.explanation}</p>
                       <DiffViewer file={f.file} before={f.before_code} after={f.fixed_code} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}
      </main>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { scrollbar-width: thin; scrollbar-color: #1e1e2e #0a0a0f; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #1e1e2e; border-radius: 2px; }
      `}</style>
    </div>
  );
}

const styles = {
  app: { minHeight: '100vh', background: '#0a0a0f', color: '#fff', fontFamily: "'Syne', sans-serif" },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', borderBottom: '1px solid #1e1e2e', background: '#0a0a0f' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  logoGlow: { width: 8, height: 8, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 10px #00ff88' },
  logo: { fontSize: 18, fontWeight: 800, letterSpacing: 3, margin: 0 },
  badge: { background: '#1e1e2e', color: '#00ff88', fontSize: 8, padding: '2px 8px', borderRadius: 4, letterSpacing: 1 },
  loginBtn: { padding: '8px 20px', background: 'transparent', border: '1px solid #00ff88', color: '#00ff88', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 },
  
  loadingScreen: { minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  spinner: { width: 30, height: 30, border: '2px solid #1e1e2e', borderTop: '2px solid #00ff88', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  
  main: { maxWidth: 1400, margin: '0 auto', padding: '32px' },
  hero: { textAlign: 'center', padding: '120px 0' },
  heroTitle: { fontSize: 42, letterSpacing: 4, marginBottom: 16, background: 'linear-gradient(to right, #fff, #00ff88)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  heroSub: { color: '#666', fontSize: 14, maxWidth: 500, margin: '0 auto 32px', fontFamily: "'JetBrains Mono', monospace" },
  heroBtn: { padding: '16px 40px', background: '#00ff88', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' },
  
  dashboardGrid: { display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 32 },
  leftCol: { display: 'flex', flexDirection: 'column', gap: 24 },
  rightCol: { display: 'flex', flexDirection: 'column', gap: 0 },
  
  card: { background: '#111118', border: '1px solid #1e1e2e', borderRadius: 20, padding: 24 },
  cardTitle: { fontSize: 12, color: '#555', letterSpacing: 2, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 },
  inputSmall: { background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: 8, color: '#fff', padding: '8px 12px', fontSize: 12, flex: 1, outline: 'none' },
  repoInput: { width: '100%', background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: 10, color: '#fff', padding: '12px 16px', fontSize: 13, marginBottom: 16, boxSizing: 'border-box', outline: 'none' },
  runBtn: { width: '100%', padding: '14px', background: 'linear-gradient(to right, #00ff88, #00cc6a)', color: '#000', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', letterSpacing: 1 },
  runBtnRunning: { background: '#ffaa00', color: '#000' },
  
  statusBox: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 },
  dot: { width: 10, height: 10, borderRadius: '50%' },
  statusText: { fontFamily: "'JetBrains Mono', monospace", fontSize: 13, letterSpacing: 2 },
  metricsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  metric: { background: '#0a0a0f', padding: 16, borderRadius: 12, border: '1px solid #1e1e2e', textAlign: 'center' },
  metricLabel: { display: 'block', fontSize: 8, color: '#444', letterSpacing: 2, marginBottom: 8 },
  metricValue: { fontSize: 24, fontWeight: 800 },
  
  fixesList: { display: 'flex', flexDirection: 'column', gap: 16 },
  fixItem: { background: '#0a0a0f', padding: 16, borderRadius: 12, border: '1px solid #1e1e2e' },
  fixFile: { color: '#00ff88', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" },
  fixBadge: { background: '#1e1e2e', padding: '2px 8px', borderRadius: 4, fontSize: 9, color: '#ffaa00' },
  fixMsg: { fontSize: 12, color: '#888', margin: '8px 0' },
  muted: { color: '#444', fontSize: 12, textAlign: 'center' }
};

export default App;
