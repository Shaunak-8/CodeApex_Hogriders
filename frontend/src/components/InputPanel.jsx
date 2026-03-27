import { useAgentStore } from '../store/agentStore';
import { Zap } from 'lucide-react';

export default function InputPanel({ onRun, status }) {
  const repoUrl = useAgentStore(s => s.repoUrl);
  const setRepoUrl = useAgentStore(s => s.setRepoUrl);

  return (
    <div style={styles.card}>
      <h3 style={styles.title}><Zap size={14} color="#00ff88" /> RUN AGENT</h3>
      <input
        type="text"
        placeholder="https://github.com/user/repo"
        value={repoUrl}
        onChange={e => setRepoUrl(e.target.value)}
        style={styles.input}
      />
      <button
        onClick={onRun}
        disabled={status === 'running' || !repoUrl}
        style={{ ...styles.btn, ...(status === 'running' ? { background: '#ffaa00' } : {}) }}
      >
        {status === 'running' ? 'AGENT ACTIVE...' : 'EXECUTE PIPELINE'}
      </button>
    </div>
  );
}

const styles = {
  card: { background: '#111118', border: '1px solid #1e1e2e', borderRadius: 16, padding: 20 },
  title: { fontSize: 11, color: '#555', letterSpacing: 2, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
  input: { width: '100%', background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: 10, color: '#fff', padding: '10px 14px', fontSize: 12, marginBottom: 12, boxSizing: 'border-box', outline: 'none' },
  btn: { width: '100%', padding: '12px', background: 'linear-gradient(135deg, #00ff88, #00cc6a)', color: '#000', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: 12, letterSpacing: 1 },
};
