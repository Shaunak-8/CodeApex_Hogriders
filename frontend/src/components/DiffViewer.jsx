import React from 'react';

const DiffViewer = ({ file, before, after }) => {
  if (!before && !after) return null;

  return (
    <div style={container}>
      <div style={header}>
        <span style={filename}>{file}</span>
      </div>
      <div style={grid}>
        <div style={side}>
          <span style={label}>BEFORE</span>
          <pre style={code}>{before}</pre>
        </div>
        <div style={side}>
          <span style={label}>AFTER</span>
          <pre style={{ ...code, borderLeft: '1px solid #00ff8822' }}>{after}</pre>
        </div>
      </div>
    </div>
  );
};

const container = {
  background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: 12, overflow: 'hidden', marginTop: 12
};
const header = { background: '#111118', padding: '8px 16px', borderBottom: '1px solid #1e1e2e' };
const filename = { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#555' };
const grid = { display: 'grid', gridTemplateColumns: '1fr 1fr' };
const side = { padding: 16 };
const label = { display: 'block', fontSize: 9, color: '#333', marginBottom: 8, letterSpacing: 1 };
const code = { 
  margin: 0, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#888', 
  whiteSpace: 'pre-wrap', wordBreak: 'break-all', minHeight: 100
};

export default DiffViewer;
