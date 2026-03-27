import { useRef, useEffect } from 'react';
import { Terminal } from 'lucide-react';

const agentColors = {
  OrchestratorAgent: '#00ff88',
  AnalyzerAgent: '#00ccff',
  ValidatorAgent: '#ffaa00',
  ReporterAgent: '#a855f7',
  GitAgent: '#ff6b6b',
  PythonFixerAgent: '#3b82f6',
  TypeFixerAgent: '#06b6d4',
  SyntaxFixerAgent: '#f59e0b',
  LogicFixerAgent: '#ef4444',
  ImportFixerAgent: '#8b5cf6',
  JSFixerAgent: '#f97316',
};

export default function AgentThoughtStream({ thoughts }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thoughts]);

  return (
    <div style={styles.card}>
      <h3 style={styles.title}><Terminal size={14} color="#00ff88" /> AGENT THOUGHT STREAM</h3>
      <div style={styles.terminal}>
        {thoughts.length === 0 && <p style={styles.muted}>Waiting for agent activity...</p>}
        {thoughts.map((t, i) => (
          <div key={i} style={styles.line}>
            <span style={{ ...styles.agent, color: agentColors[t.agent] || '#555' }}>[{t.agent}]</span>
            <span style={styles.msg}>{t.message}</span>
            <span style={styles.time}>{t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : ''}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

const styles = {
  card: { background: '#111118', border: '1px solid #1e1e2e', borderRadius: 16, padding: 20, flex: 1 },
  title: { fontSize: 11, color: '#555', letterSpacing: 2, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
  terminal: { background: '#080810', border: '1px solid #1a1a25', borderRadius: 10, padding: 16, maxHeight: 360, overflowY: 'auto', fontFamily: "'JetBrains Mono', monospace" },
  muted: { color: '#333', fontSize: 11, textAlign: 'center' },
  line: { display: 'flex', gap: 8, marginBottom: 6, fontSize: 11, lineHeight: 1.6 },
  agent: { fontWeight: 700, whiteSpace: 'nowrap', fontSize: 10 },
  msg: { color: '#aaa', flex: 1 },
  time: { color: '#333', fontSize: 9, whiteSpace: 'nowrap' },
};
