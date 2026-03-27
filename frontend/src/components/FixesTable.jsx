import BlastRadiusBadge from './BlastRadiusBadge';
import { Bug } from 'lucide-react';

export default function FixesTable({ fixes }) {
  return (
    <div style={styles.card}>
      <h3 style={styles.title}><Bug size={14} color="#ffaa00" /> FIXES APPLIED</h3>
      {fixes.length === 0 ? (
        <p style={styles.muted}>No fixes applied yet.</p>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['File', 'Type', 'Agent', 'Confidence', 'Radius', 'Status'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fixes.map((f, i) => (
                <tr key={i} style={styles.row}>
                  <td style={styles.tdFile}>{f.file || '-'}</td>
                  <td style={styles.td}><span style={styles.typeBadge}>{f.bug_type || '-'}</span></td>
                  <td style={styles.td}>{f.agent || f.bug_type || '-'}</td>
                  <td style={styles.td}>{f.confidence || '-'}%</td>
                  <td style={styles.td}><BlastRadiusBadge radius={f.blast_radius || 1} /></td>
                  <td style={styles.td}><span style={{ ...styles.statusDot, background: f.status === 'applied' ? '#00ff88' : '#ff3b3b' }}></span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: { background: '#111118', border: '1px solid #1e1e2e', borderRadius: 16, padding: 20 },
  title: { fontSize: 11, color: '#555', letterSpacing: 2, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
  muted: { color: '#333', fontSize: 11, textAlign: 'center' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: 9, color: '#444', letterSpacing: 1, padding: '8px 10px', borderBottom: '1px solid #1e1e2e' },
  row: { borderBottom: '1px solid #0a0a0f' },
  td: { padding: '10px', fontSize: 11, color: '#888' },
  tdFile: { padding: '10px', fontSize: 11, color: '#00ff88', fontFamily: "'JetBrains Mono', monospace" },
  typeBadge: { background: '#1e1e2e', padding: '2px 8px', borderRadius: 4, fontSize: 9, color: '#ffaa00' },
  statusDot: { display: 'inline-block', width: 8, height: 8, borderRadius: '50%' },
};
