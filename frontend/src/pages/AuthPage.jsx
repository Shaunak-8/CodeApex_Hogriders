import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { login, signUp, loginWithGitHub } from '../lib/supabase';
import { Github, Mail, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get('mode') === 'signup' ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUp(email, password);
        navigate('/onboarding');
      } else {
        await login(email, password);
        navigate('/app');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGitHub = async () => {
    try { await loginWithGitHub(); } catch (err) { setError(err.message); }
  };

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <button style={styles.backBtn} onClick={() => navigate('/')}>
          <ArrowLeft size={14} /> Back
        </button>
        <div style={styles.leftContent}>
          <div style={styles.dot}></div>
          <h1 style={styles.leftTitle}>HOGRIDERS</h1>
          <p style={styles.leftSub}>Autonomous CI/CD Healing Agent.<br />Fix your code while you sleep.</p>
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.formBox}>
          <h2 style={styles.formTitle}>{mode === 'login' ? 'WELCOME BACK' : 'CREATE ACCOUNT'}</h2>
          <p style={styles.formSub}>{mode === 'login' ? 'Sign in to your dashboard' : 'Get started with Hogriders'}</p>

          <button style={styles.githubBtn} onClick={handleGitHub}>
            <Github size={16} /> Continue with GitHub
          </button>

          <div style={styles.divider}>
            <span style={styles.divLine}></span>
            <span style={styles.divText}>or</span>
            <span style={styles.divLine}></span>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={styles.inputGroup}>
              <Mail size={14} color="#555" style={{ position: 'absolute', left: 14, top: 14 }} />
              <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} style={styles.input} required />
            </div>
            <div style={styles.inputGroup}>
              <Lock size={14} color="#555" style={{ position: 'absolute', left: 14, top: 14 }} />
              <input type={showPw ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={styles.input} required />
              <button type="button" onClick={() => setShowPw(!showPw)} style={styles.eyeBtn}>
                {showPw ? <EyeOff size={14} color="#555" /> : <Eye size={14} color="#555" />}
              </button>
            </div>
            {error && <p style={styles.error}>{error}</p>}
            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? 'PROCESSING...' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </button>
          </form>

          <p style={styles.toggle}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button style={styles.toggleBtn} onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', background: '#0a0a0f', fontFamily: "'Syne', sans-serif" },
  left: { flex: 1, background: '#080810', display: 'flex', flexDirection: 'column', padding: 40, position: 'relative', borderRight: '1px solid #1e1e2e' },
  backBtn: { display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 12, marginBottom: 40 },
  leftContent: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: 40 },
  dot: { width: 10, height: 10, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 16px #00ff88', marginBottom: 20 },
  leftTitle: { fontSize: 36, fontWeight: 900, letterSpacing: 4, marginBottom: 12 },
  leftSub: { color: '#555', fontSize: 13, lineHeight: 1.8, fontFamily: "'JetBrains Mono', monospace" },

  right: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  formBox: { width: 380, padding: 40 },
  formTitle: { fontSize: 22, fontWeight: 800, letterSpacing: 2, marginBottom: 8 },
  formSub: { color: '#555', fontSize: 12, marginBottom: 32, fontFamily: "'JetBrains Mono', monospace" },

  githubBtn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px 0', background: '#111118', border: '1px solid #1e1e2e', color: '#fff', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' },
  divLine: { flex: 1, height: 1, background: '#1e1e2e' },
  divText: { color: '#333', fontSize: 10, letterSpacing: 2 },

  inputGroup: { position: 'relative', marginBottom: 16 },
  input: { width: '100%', background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: 10, color: '#fff', padding: '12px 16px 12px 40px', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  eyeBtn: { position: 'absolute', right: 14, top: 12, background: 'none', border: 'none', cursor: 'pointer' },
  error: { color: '#ff3b3b', fontSize: 11, marginBottom: 12 },
  submitBtn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #00ff88, #00cc6a)', color: '#000', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: 13, letterSpacing: 1 },

  toggle: { textAlign: 'center', color: '#555', fontSize: 12, marginTop: 24, fontFamily: "'JetBrains Mono', monospace" },
  toggleBtn: { background: 'none', border: 'none', color: '#00ff88', cursor: 'pointer', fontSize: 12 },
};
