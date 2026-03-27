import { Heart } from 'lucide-react';

export default function RepoHealthScore({ healthScore }) {
  const before = healthScore?.before || 0;
  const after = healthScore?.after || 0;
  const improvement = after - before;

  return (
    <div style={styles.card}>
      <h3 style={styles.title}><Heart size={14} color="#ff3b3b" /> REPO HEALTH</h3>
      <div style={styles.gaugeWrap}>
        <div style={styles.gaugeTrack}>
          <div style={{ ...styles.gaugeFill, width: `${after}%` }}></div>
        </div>
        <div style={styles.labels}>
          <span style={styles.before}>Before: {before}%</span>
          <span style={styles.after}>After: {after}%</span>
        </div>
        {improvement > 0 && (
          <div style={styles.improvement}>+{improvement}% improvement</div>
        )}
      </div>
    </div>
  );
}

const styles = {
  card: { background: '#111118', border: '1px solid #1e1e2e', borderRadius: 16, padding: 20 },
  title: { fontSize: 11, color: '#555', letterSpacing: 2, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
  gaugeWrap: {},
  gaugeTrack: { height: 8, background: '#1e1e2e', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  gaugeFill: { height: '100%', background: 'linear-gradient(to right, #ff3b3b, #00ff88)', borderRadius: 4, transition: 'width 1s ease-out' },
  labels: { display: 'flex', justifyContent: 'space-between' },
  before: { fontSize: 10, color: '#555', fontFamily: "'JetBrains Mono', monospace" },
  after: { fontSize: 10, color: '#00ff88', fontFamily: "'JetBrains Mono', monospace" },
  improvement: { textAlign: 'center', marginTop: 8, fontSize: 11, color: '#00ff88', fontWeight: 700 },
};
