import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { login, signUp, loginWithGitHub } from '../lib/supabase';
import { Github, Mail, Lock, ArrowLeft, Eye, EyeOff, Terminal, Shield, Cpu, Activity } from 'lucide-react';

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
      {/* Grid Overlay */}
      <div style={styles.gridOverlay}></div>

      <div style={styles.container}>
        <div style={styles.header}>
            <div style={styles.brandBox}>
                <div style={styles.dot}></div>
                <span style={styles.brand}>MCLOVIN</span>
            </div>
        </div>

        <div style={styles.authBox}>
          <div style={styles.terminalHeader}>
            <h1 className="pixel-title-green-3d" style={{...styles.title, fontSize: '24px !important'}}>{mode === 'login' ? 'LOGIN TO MCLOVIN' : 'REGISTER NODE'}</h1>
            <p style={styles.subtitle}>AUTHENTICATION_PROTOCOL_V4.0</p>
          </div>

          <button style={styles.githubBtn} onClick={handleGitHub}>
            <Terminal size={18} color="var(--green)" />
            <span>CONTINUE WITH GITHUB</span>
          </button>

          <div style={styles.divider}>
            <span style={styles.divLine}></span>
            <span style={styles.divText}>OR_USER_AUTH</span>
            <span style={styles.divLine}></span>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>TERMINAL_ID</label>
              <div style={styles.inputWrapper}>
                <input 
                  type="email" 
                  placeholder="UID-000-000" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  style={styles.input} 
                  required 
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>SEC_KEY</label>
              <div style={styles.inputWrapper}>
                <input 
                  type={showPw ? 'text' : 'password'} 
                  placeholder="••••••••••••" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  style={styles.input} 
                  required 
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={styles.eyeBtn}>
                  {showPw ? <EyeOff size={14} color="var(--text-secondary)" /> : <Eye size={14} color="var(--text-secondary)" />}
                </button>
              </div>
            </div>

            {error && <p style={styles.error}>{error}</p>}

            <button type="submit" disabled={loading} style={styles.submitBtn}>
              <Activity size={18} />
              <span>{loading ? 'INITIALIZING...' : mode === 'login' ? 'INITIALIZE SESSION' : 'REGISTER_NODE'}</span>
            </button>
          </form>

          <div style={styles.toggleBox}>
            <button style={styles.toggleBtn} onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
              [ {mode === 'login' ? 'REGISTER_NODE' : 'ACCESS_SESSION'} ]
            </button>
          </div>

          <div style={styles.authFooter}>
            <div style={styles.footerItem}>
                <span style={styles.footerLabel}>ENCRYPTION:</span>
                <span style={styles.footerVal}>AES-256</span>
            </div>
            <div style={styles.footerItem}>
                <span style={styles.footerLabel}>UPLINK:</span>
                <span style={styles.footerVal}>ACTIVE</span>
            </div>
          </div>
        </div>

        <div style={styles.pageFooter}>
            <span style={styles.statusText}>SYS_STATUS: OPERATIONAL // @2024_MCLOVIN_CORP</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: 'var(--bg)', color: '#fff', fontFamily: "var(--font-heading)", position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  gridOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundSize: '60px 60px', backgroundImage: 'linear-gradient(rgba(30, 30, 46, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 30, 46, 0.1) 1px, transparent 1px)', pointerEvents: 'none', zIndex: -1 },

  container: { width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 24, padding: 20 },
  header: { display: 'flex', justifyContent: 'flex-start', marginBottom: 20 },
  brandBox: { display: 'flex', alignItems: 'center', gap: 12 },
  dot: { width: 10, height: 10, background: 'var(--green)', boxShadow: '0 0 10px var(--green)', borderRadius: '2px' },
  brand: { fontSize: 18, fontWeight: 800, letterSpacing: 3, color: 'var(--green)' },

  authBox: { background: 'var(--surface)', border: '1px solid var(--border)', padding: '60px 50px', borderRadius: 4, position: 'relative', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' },
  terminalHeader: { textAlign: 'center', marginBottom: 48 },
  title: { fontSize: 24, fontWeight: 700, letterSpacing: 2, marginBottom: 8, color: 'var(--text-primary)' },
  subtitle: { fontSize: 10, letterSpacing: 4, color: 'var(--text-secondary)', fontWeight: 600, fontFamily: "var(--font-mono)" },

  githubBtn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '18px 0', background: 'transparent', border: '1px solid var(--border)', color: 'var(--green)', borderRadius: 2, cursor: 'pointer', fontSize: 12, fontWeight: 800, letterSpacing: 2, transition: '0.3s' },
  
  divider: { display: 'flex', alignItems: 'center', gap: 16, margin: '40px 0' },
  divLine: { flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' },
  divText: { color: 'var(--text-secondary)', fontSize: 9, letterSpacing: 2, fontWeight: 700, fontFamily: "var(--font-mono)" },

  form: { display: 'flex', flexDirection: 'column', gap: 32 },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: 10 },
  label: { fontSize: 10, letterSpacing: 2, color: 'var(--text-secondary)', fontWeight: 700, fontFamily: "var(--font-mono)" },
  inputWrapper: { position: 'relative' },
  input: { width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', padding: '16px', color: '#fff', fontSize: 14, fontFamily: "var(--font-mono)", outline: 'none', borderRadius: 2, transition: '0.3s' },
  eyeBtn: { position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' },

  error: { color: 'var(--red)', fontSize: 11, textAlign: 'center', fontFamily: "var(--font-mono)" },
  submitBtn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '20px', background: 'var(--green)', color: '#000', border: 'none', borderRadius: 4, fontWeight: 800, cursor: 'pointer', fontSize: 14, letterSpacing: 2, transition: '0.3s', marginTop: 10 },

  toggleBox: { textAlign: 'center', marginTop: 40 },
  toggleBtn: { background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 10, fontWeight: 700, letterSpacing: 2, fontFamily: "var(--font-mono)" },

  authFooter: { marginTop: 60, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' },
  footerItem: { display: 'flex', gap: 8, fontSize: 9, fontFamily: "var(--font-mono)" },
  footerLabel: { color: 'var(--text-secondary)' },
  footerVal: { color: 'var(--text-primary)', fontWeight: 700 },

  pageFooter: { textAlign: 'center', marginTop: 24 },
  statusText: { fontSize: 10, letterSpacing: 2, color: 'var(--green)', fontWeight: 700, opacity: 0.8 }
};
