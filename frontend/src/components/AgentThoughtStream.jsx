import { useRef, useEffect } from 'react';
import { Terminal, Activity } from 'lucide-react';

const agentColors = {
  OrchestratorAgent: 'var(--green)',
  AnalyzerAgent: 'var(--cyan)',
  ValidatorAgent: '#ffaa00',
  ReporterAgent: '#a855f7',
  GitAgent: 'var(--red)',
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
    <div style={styles.container}>
      <div style={styles.terminal}>
        <div style={styles.scanline}></div>
        {thoughts.length === 0 && (
            <div style={styles.empty}>
                <Activity size={16} color="var(--text-secondary)" className="pulse" />
                <span style={styles.muted}>WAITING_FOR_UPLINK_ACTIVITY...</span>
            </div>
        )}
        {thoughts.map((t, i) => (
          <div key={i} style={styles.line}>
            <div style={styles.timeWrap}>
                <span style={styles.time}>{t.timestamp ? new Date(t.timestamp).toLocaleTimeString([], {hour12: false}) : '--:--:--'}</span>
            </div>
            <div style={styles.content}>
                <span style={{ ...styles.agent, color: agentColors[t.agent] || 'var(--text-secondary)' }}>
                    [{t.agent.toUpperCase()}]
                </span>
                <span style={{...styles.msg, color: t.type === 'error' ? 'var(--red)' : '#bbb'}}>{t.message.toUpperCase()}</span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

const styles = {
  container: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' },
  terminal: { padding: 24, minHeight: 400, maxHeight: 600, overflowY: 'auto', fontFamily: "var(--font-mono)", background: 'rgba(0,0,0,0.4)', position: 'relative' },
  scanline: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(0, 255, 136, 0.01) 50%)', backgroundSize: '100% 4px', pointerEvents: 'none', zIndex: 1 },
  
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 16, opacity: 0.3 },
  muted: { fontSize: 9, letterSpacing: 2, fontWeight: 800, color: 'var(--text-secondary)' },

  line: { display: 'flex', gap: 16, marginBottom: 10, fontSize: 11, lineHeight: 1.5, position: 'relative', zIndex: 2 },
  timeWrap: { width: 70, flexShrink: 0 },
  time: { color: 'var(--text-secondary)', opacity: 0.4, fontSize: 9 },
  content: { display: 'flex', gap: 10, flex: 1 },
  agent: { fontWeight: 900, whiteSpace: 'nowrap', fontSize: 9, letterSpacing: 1 },
  msg: { flex: 1, wordBreak: 'break-word', letterSpacing: 0.5 },
};
