export default function BlastRadiusBadge({ radius = 1 }) {
  const r = Number(radius) || 1;
  let color = '#00ff88';
  let bg = '#00ff8811';
  if (r >= 5) { color = '#ff3b3b'; bg = '#ff3b3b11'; }
  else if (r >= 3) { color = '#ffaa00'; bg = '#ffaa0011'; }

  return (
    <span style={{ ...styles.badge, color, background: bg, borderColor: color + '33' }}>
      {r}
    </span>
  );
}

const styles = {
  badge: { display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, border: '1px solid', fontFamily: "'JetBrains Mono', monospace" },
};
