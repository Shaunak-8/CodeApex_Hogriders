import React from 'react';
import { CheckCircle, AlertCircle, Terminal, GitBranch, ShieldCheck } from 'lucide-react';

const Timeline = ({ thoughts }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'RUN_STARTED': return <GitBranch color="#00ff88" size={14} />;
      case 'ANALYSIS_STARTED': return <Terminal color="#00ccff" size={14} />;
      case 'FAILURE_DETECTED': return <AlertCircle color="#ff3b3b" size={14} />;
      case 'VALIDATION_RESULT': return <ShieldCheck color="#ffaa00" size={14} />;
      case 'RUN_COMPLETED': return <CheckCircle color="#00ff88" size={14} />;
      default: return <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#333' }} />;
    }
  };

  return (
    <div style={container}>
      <h3 style={title}>CI/CD TIMELINE</h3>
      <div style={list}>
        {thoughts.map((item, i) => (
          <div key={i} style={entry}>
            <div style={iconBox}>{getIcon(item.type)}</div>
            <div style={line} />
            <div style={content}>
              <div style={header}>
                <span style={agent}>{item.agent || 'System'}</span>
                <span style={time}>{new Date(item.timestamp).toLocaleTimeString()}</span>
              </div>
              <p style={msg}>{item.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const container = {
  background: '#111118', border: '1px solid #1e1e2e', borderRadius: 16, padding: 24,
};
const title = {
  fontFamily: "'Syne', sans-serif", fontSize: 13, color: '#555', letterSpacing: 2, marginBottom: 20
};
const list = { display: 'flex', flexDirection: 'column', gap: 0 };
const entry = { display: 'flex', gap: 16, position: 'relative' };
const iconBox = { 
  width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: '#0a0a0f', borderRadius: '50%', border: '1px solid #1e1e2e', zIndex: 2
};
const line = {
  position: 'absolute', left: 11, top: 24, bottom: -12, width: 1, background: '#1e1e2e', zIndex: 1
};
const content = { paddingBottom: 24, flex: 1 };
const header = { display: 'flex', justifyContent: 'space-between', marginBottom: 4 };
const agent = { color: '#00ff88', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" };
const time = { color: '#333', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" };
const msg = { color: '#888', fontSize: 11, margin: 0, lineHeight: 1.5 };

export default Timeline;
