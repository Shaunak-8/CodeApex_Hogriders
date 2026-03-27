export default function StatusBadge({ status = 'idle' }) {
  const config = {
    idle: { color: '#555', bg: '#1e1e2e', label: 'IDLE' },
    running: { color: '#ffaa00', bg: '#ffaa0011', label: 'RUNNING' },
    passed: { color: '#00ff88', bg: '#00ff8811', label: 'PASSED' },
    failed: { color: '#ff3b3b', bg: '#ff3b3b11', label: 'FAILED' },
  };
  const c = config[status] || config.idle;

  return (
    <div style={{ ...styles.badge, color: c.color, background: c.bg, borderColor: c.color + '33' }}>
      <div style={{ ...styles.dot, background: c.color, boxShadow: status === 'running' ? `0 0 6px ${c.color}` : 'none' }}></div>
      {c.label}
    </div>
  );
}

const styles = {
  badge: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 9, fontWeight: 700, padding: '4px 12px', borderRadius: 20, border: '1px solid', letterSpacing: 1, fontFamily: "'JetBrains Mono', monospace" },
  dot: { width: 6, height: 6, borderRadius: '50%' },
};
