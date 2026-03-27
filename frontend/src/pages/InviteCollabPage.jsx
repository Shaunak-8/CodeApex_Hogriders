import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Mail, Copy, Check, ArrowRight, Plus, X } from 'lucide-react';

export default function InviteCollabPage() {
  const navigate = useNavigate();
  const [emails, setEmails] = useState([]);
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const inviteLink = `${window.location.origin}/join/team-hogriders`;

  const addEmail = () => {
    if (input && input.includes('@') && !emails.includes(input)) {
      setEmails([...emails, input]);
      setInput('');
    }
  };

  const removeEmail = (email) => setEmails(emails.filter(e => e !== email));

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.progress}>
          <div style={styles.stepDone}></div>
          <div style={styles.stepDone}></div>
          <div style={styles.stepDone}></div>
          <div style={styles.stepActive}></div>
        </div>

        <p style={styles.eyebrow}>STEP 4 OF 4</p>
        <h1 style={styles.title}>Invite Collaborators</h1>
        <p style={styles.sub}>Add team members to collaborate on this project.</p>

        {/* Email Input */}
        <div style={styles.emailBox}>
          <div style={styles.emailInputRow}>
            <Mail size={14} color="#555" />
            <input
              style={styles.emailInput}
              placeholder="teammate@email.com"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addEmail())}
            />
            <button style={styles.addBtn} onClick={addEmail}><Plus size={14} /></button>
          </div>

          {emails.length > 0 && (
            <div style={styles.chips}>
              {emails.map((email, i) => (
                <div key={i} style={styles.chip}>
                  <span>{email}</span>
                  <button style={styles.chipX} onClick={() => removeEmail(email)}><X size={10} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invite Link */}
        <div style={styles.linkSection}>
          <p style={styles.linkLabel}>Or share this invite link:</p>
          <div style={styles.linkBox}>
            <span style={styles.linkText}>{inviteLink}</span>
            <button style={styles.copyBtn} onClick={copyLink}>
              {copied ? <Check size={14} color="#00ff88" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        <div style={styles.btns}>
          <button style={styles.skipBtn} onClick={() => navigate('/app')}>SKIP FOR NOW</button>
          <button style={styles.nextBtn} onClick={() => navigate('/app')}>
            {emails.length > 0 ? `SEND ${emails.length} INVITE${emails.length > 1 ? 'S' : ''}` : 'GO TO DASHBOARD'} <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne', sans-serif" },
  container: { width: 520, padding: 48 },
  progress: { display: 'flex', gap: 6, marginBottom: 32 },
  stepDone: { flex: 1, height: 3, borderRadius: 2, background: '#00ff88' },
  stepActive: { flex: 1, height: 3, borderRadius: 2, background: 'linear-gradient(to right, #00ff88, #1e1e2e)' },
  eyebrow: { fontSize: 10, letterSpacing: 3, color: '#00ff88', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 800, letterSpacing: 1, marginBottom: 8 },
  sub: { color: '#555', fontSize: 12, marginBottom: 32, fontFamily: "'JetBrains Mono', monospace" },

  emailBox: { background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, padding: 16, marginBottom: 24 },
  emailInputRow: { display: 'flex', alignItems: 'center', gap: 10 },
  emailInput: { flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: 13, outline: 'none' },
  addBtn: { background: '#1e1e2e', border: 'none', color: '#00ff88', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex' },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { display: 'flex', alignItems: 'center', gap: 6, background: '#00ff8811', border: '1px solid #00ff8833', borderRadius: 20, padding: '4px 12px', fontSize: 11, color: '#00ff88' },
  chipX: { background: 'none', border: 'none', color: '#00ff88', cursor: 'pointer', display: 'flex', padding: 0 },

  linkSection: { marginBottom: 32 },
  linkLabel: { color: '#555', fontSize: 10, letterSpacing: 1, marginBottom: 8 },
  linkBox: { display: 'flex', alignItems: 'center', gap: 10, background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: 10, padding: '10px 14px' },
  linkText: { flex: 1, color: '#555', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  copyBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#555', display: 'flex' },

  btns: { display: 'flex', gap: 12 },
  skipBtn: { flex: 1, padding: '14px', background: 'transparent', border: '1px solid #1e1e2e', color: '#555', borderRadius: 10, cursor: 'pointer', fontSize: 11, fontWeight: 600 },
  nextBtn: { flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', background: 'linear-gradient(135deg, #00ff88, #00cc6a)', color: '#000', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: 13 },
};
