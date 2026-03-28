import React, { useEffect, useRef } from 'react';
import { GitBranch, CheckCircle, AlertCircle, Shield, Zap, Terminal } from 'lucide-react';

const iconMap = {
  RUN_STARTED: { icon: <GitBranch size={13} />, color: '#00ff88' },
  ANALYSIS_STARTED: { icon: <Terminal size={13} />, color: '#00ccff' },
  FAILURE_DETECTED: { icon: <AlertCircle size={13} />, color: '#ff3b3b' },
  FIX_ROUTED: { icon: <Zap size={13} />, color: '#ffaa00' },
  FIX_APPLIED: { icon: <CheckCircle size={13} />, color: '#00ff88' },
  VALIDATION_STARTED: { icon: <Shield size={13} />, color: '#a855f7' },
  VALIDATION_DONE: { icon: <CheckCircle size={13} />, color: '#00ff88' },
  VALIDATION_RESULT: { icon: <Shield size={13} />, color: '#a855f7' },
  COMMIT_STARTED: { icon: <GitBranch size={13} />, color: '#00ccff' },
  COMMIT_DONE: { icon: <CheckCircle size={13} />, color: '#00ff88' },
  COMMIT_FAILED: { icon: <AlertCircle size={13} />, color: '#ff3b3b' },
  RUN_COMPLETED: { icon: <CheckCircle size={13} />, color: '#00ff88' },
};

export default function CICDTimeline({ thoughts }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thoughts]);

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>ORCHESTRATION_TIMELINE</h3>
      <div style={styles.list} ref={scrollRef}>
        {thoughts.length === 0 && <p style={styles.muted}>WAITING_FOR_TELEMETRY...</p>}
        {thoughts.map((t, i) => {
          const meta = iconMap[t.type] || { icon: <div style={styles.defaultDot}></div>, color: '#333' };
          return (
            <div key={i} style={styles.item}>
              <div style={{ ...styles.iconWrap, borderColor: meta.color }}>{meta.icon}</div>
              {i < thoughts.length - 1 && <div style={styles.line}></div>}
              <div style={styles.content}>
                <div style={styles.itemHeader}>
                  <span style={{ ...styles.agent, color: meta.color }}>{t.agent}</span>
                  <span style={styles.time}>{t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : ''}</span>
                </div>
                <p style={styles.msg}>{t.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  card: { background: '#111118', border: '1px solid #1e1e2e', borderRadius: 16, padding: 20 },
  title: { fontSize: 13, color: 'var(--text-secondary)', letterSpacing: 2, marginBottom: 16, fontFamily: "var(--font-mono)", fontWeight: 800 },
  list: { display: 'flex', flexDirection: 'column', maxHeight: 400, overflowY: 'auto' },
  muted: { color: 'rgba(255, 255, 255, 0.6) !important', fontSize: 13, textAlign: 'center', padding: '20px 0', fontFamily: "var(--font-mono)", letterSpacing: 1 },
  item: { display: 'flex', gap: 14, position: 'relative', paddingBottom: 4 },
  iconWrap: { width: 28, height: 28, borderRadius: '50%', background: '#0a0a0f', border: '1px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, flexShrink: 0 },
  line: { position: 'absolute', left: 13, top: 28, bottom: 0, width: 1, background: '#1e1e2e', zIndex: 1 },
  defaultDot: { width: 6, height: 6, borderRadius: '50%', background: '#333' },
  content: { flex: 1, paddingBottom: 16 },
  itemHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 2 },
  agent: { fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" },
  time: { fontSize: 11, color: '#333', fontFamily: "'JetBrains Mono', monospace" },
  msg: { fontSize: 14, color: '#777', margin: 0, lineHeight: 1.5 },
};
