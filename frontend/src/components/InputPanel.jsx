import { useAgentStore } from '../store/agentStore';
import { Terminal, Zap, Shield } from 'lucide-react';

export default function InputPanel({ onRun, status }) {
  const repoUrl = useAgentStore(s => s.repoUrl);
  const setRepoUrl = useAgentStore(s => s.setRepoUrl);

  return (
    <div style={styles.container}>
      <div style={styles.inputWrap}>
        <div style={styles.label}>
            <Terminal size={10} color="var(--green)" />
            <span>TARGET_UPLINK_PROTOCOL</span>
        </div>
        <input
          type="text"
          placeholder="ENTER GITHUB REPOSITORY URI..."
          value={repoUrl}
          onChange={e => setRepoUrl(e.target.value)}
          style={styles.input}
        />
      </div>
      <button
        onClick={onRun}
        disabled={status === 'running' || !repoUrl}
        style={{ 
            ...styles.btn, 
            ...(status === 'running' ? styles.btnActive : {}),
            opacity: !repoUrl ? 0.3 : 1
        }}
      >
        <Zap size={14} />
        <span>{status === 'running' ? 'PROTOCOL_EXECUTING...' : 'INITIATE_UPLINK_RUN'}</span>
      </button>

      <div style={styles.footer}>
        <Shield size={10} color="var(--text-secondary)" />
        <span>SEC_LEVEL_CONFIRMED: MCLOVIN_V3</span>
      </div>
    </div>
  );
}

const styles = {
  container: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 },
  inputWrap: { display: 'flex', flexDirection: 'column', gap: 10 },
  label: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 8, fontWeight: 800, color: 'var(--text-secondary)', fontFamily: "var(--font-mono)", letterSpacing: 1 },
  input: { width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 2, color: '#fff', padding: '14px', fontSize: 11, fontFamily: "var(--font-mono)", outline: 'none', transition: '0.3s', ':focus': { borderColor: 'var(--green)' } },
  btn: { width: '100%', padding: '16px', background: 'var(--green)', color: '#000', border: 'none', borderRadius: 2, fontWeight: 900, cursor: 'pointer', fontSize: 11, letterSpacing: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, transition: '0.3s' },
  btnActive: { background: 'var(--cyan)', boxShadow: '0 0 20px var(--cyan)' },
  footer: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 8, color: 'var(--text-secondary)', fontFamily: "var(--font-mono)", opacity: 0.5 },
};
