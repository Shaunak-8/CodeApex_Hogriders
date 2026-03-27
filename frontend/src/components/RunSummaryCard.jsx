import { Target, AlertTriangle, CheckCircle, Layers } from 'lucide-react';

export default function RunSummaryCard({ status, totalFailures, totalFixes, score }) {
  const metrics = [
    { label: 'FAILURES', value: totalFailures, icon: <AlertTriangle size={14} />, color: '#ff3b3b' },
    { label: 'FIXES', value: totalFixes, icon: <CheckCircle size={14} />, color: '#00ff88' },
    { label: 'SCORE', value: score?.total || score?.final || 0, icon: <Target size={14} />, color: '#00ccff' },
  ];

  return (
    <div style={styles.card}>
      <h3 style={styles.title}><Layers size={14} color="#a855f7" /> RUN SUMMARY</h3>
      <div style={styles.grid}>
        {metrics.map((m, i) => (
          <div key={i} style={styles.metricBox}>
            <div style={{ color: m.color, marginBottom: 8 }}>{m.icon}</div>
            <span style={{ ...styles.value, color: m.color }}>{m.value}</span>
            <span style={styles.label}>{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  card: { background: '#111118', border: '1px solid #1e1e2e', borderRadius: 16, padding: 20 },
  title: { fontSize: 11, color: '#555', letterSpacing: 2, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 },
  metricBox: { background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: 12, padding: 16, textAlign: 'center' },
  value: { display: 'block', fontSize: 22, fontWeight: 800 },
  label: { display: 'block', fontSize: 8, color: '#444', letterSpacing: 2, marginTop: 6 },
};
