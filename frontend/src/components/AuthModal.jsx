import { useState } from 'react';
import { loginWithGitHub, signUp, login } from '../lib/supabase';

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUp(email, password);
      } else {
        await login(email, password);
      }
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGitHub = async () => {
    setError('');
    try {
      await loginWithGitHub();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button style={styles.closeBtn} onClick={onClose}>✕</button>
        <h2 style={styles.title}>
          {mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
        </h2>

        <button style={styles.githubBtn} onClick={handleGitHub}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style={{ marginRight: 10 }}>
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          Continue with GitHub
        </button>

        <div style={styles.divider}>
          <span style={styles.dividerLine}></span>
          <span style={styles.dividerText}>OR</span>
          <span style={styles.dividerLine}></span>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? 'PROCESSING...' : mode === 'login' ? 'SIGN IN' : 'SIGN UP'}
          </button>
        </form>

        <p style={styles.toggle}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            style={styles.toggleBtn}
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          >
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(8px)',
  },
  modal: {
    background: '#111118',
    border: '1px solid #1e1e2e',
    borderRadius: 16,
    padding: '40px 36px',
    width: '100%',
    maxWidth: 420,
    position: 'relative',
    boxShadow: '0 0 60px rgba(0,255,136,0.05)',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    background: 'none',
    border: 'none',
    color: '#666',
    fontSize: 18,
    cursor: 'pointer',
  },
  title: {
    color: '#fff',
    fontFamily: "'Syne', sans-serif",
    fontSize: 22,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 28,
    letterSpacing: 2,
  },
  githubBtn: {
    width: '100%',
    padding: '14px 20px',
    background: '#1e1e2e',
    border: '1px solid #2a2a3a',
    borderRadius: 10,
    color: '#fff',
    fontSize: 14,
    fontFamily: "'JetBrains Mono', monospace",
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '24px 0',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: '#1e1e2e',
  },
  dividerText: {
    color: '#555',
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  input: {
    padding: '14px 16px',
    background: '#0a0a0f',
    border: '1px solid #1e1e2e',
    borderRadius: 10,
    color: '#fff',
    fontSize: 14,
    fontFamily: "'JetBrains Mono', monospace",
    outline: 'none',
  },
  error: {
    color: '#ff3b3b',
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
    margin: 0,
  },
  submitBtn: {
    padding: '14px 20px',
    background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
    border: 'none',
    borderRadius: 10,
    color: '#0a0a0f',
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "'Syne', sans-serif",
    cursor: 'pointer',
    letterSpacing: 2,
    transition: 'all 0.2s ease',
  },
  toggle: {
    color: '#555',
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
    textAlign: 'center',
    marginTop: 20,
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: '#00ff88',
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};
