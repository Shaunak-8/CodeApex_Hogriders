import { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useAgentStore } from './store/agentStore';
import AuthModal from './components/AuthModal';
import UserAvatar from './components/UserAvatar';

function App() {
  const { user, loading, initialize } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const repoUrl = useAgentStore((s) => s.repoUrl);
  const setRepoUrl = useAgentStore((s) => s.setRepoUrl);
  const status = useAgentStore((s) => s.status);

  useEffect(() => {
    initialize();
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>INITIALIZING...</p>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logoGlow}></div>
          <h1 style={styles.logo}>HOGRIDERS</h1>
          <span style={styles.badge}>CI/CD AGENT</span>
        </div>
        <div style={styles.headerRight}>
          {user ? (
            <UserAvatar />
          ) : (
            <button style={styles.loginBtn} onClick={() => setShowAuth(true)}>
              SIGN IN
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {!user ? (
          <div style={styles.hero}>
            <h2 style={styles.heroTitle}>AUTONOMOUS CI/CD HEALING</h2>
            <p style={styles.heroSub}>
              AI-powered multi-agent system that detects, analyzes, and
              automatically fixes code failures in GitHub repositories.
            </p>
            <button style={styles.heroBtn} onClick={() => setShowAuth(true)}>
              GET STARTED
            </button>
          </div>
        ) : (
          <div style={styles.dashboard}>
            <div style={styles.inputCard}>
              <h3 style={styles.cardTitle}>RUN AGENT</h3>
              <input
                type="text"
                placeholder="Paste GitHub repo URL..."
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                style={styles.repoInput}
              />
              <button
                style={{
                  ...styles.runBtn,
                  ...(status === 'running' ? styles.runBtnRunning : {}),
                }}
                disabled={status === 'running' || !repoUrl}
              >
                {status === 'running' ? 'HEALING IN PROGRESS...' : 'RUN AGENT'}
              </button>
            </div>

            <div style={styles.statusCard}>
              <h3 style={styles.cardTitle}>STATUS</h3>
              <div style={styles.statusIndicator}>
                <div
                  style={{
                    ...styles.statusDot,
                    background:
                      status === 'passed'
                        ? '#00ff88'
                        : status === 'failed'
                        ? '#ff3b3b'
                        : status === 'running'
                        ? '#ffaa00'
                        : '#333',
                    boxShadow:
                      status === 'passed'
                        ? '0 0 20px rgba(0,255,136,0.5)'
                        : status === 'failed'
                        ? '0 0 20px rgba(255,59,59,0.5)'
                        : status === 'running'
                        ? '0 0 20px rgba(255,170,0,0.5)'
                        : 'none',
                  }}
                ></div>
                <span style={styles.statusText}>{status.toUpperCase()}</span>
              </div>
              <p style={styles.userInfo}>
                Logged in as{' '}
                <span style={{ color: '#00ff88' }}>
                  {user.user_metadata?.full_name || user.email}
                </span>
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Auth Modal */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(0,255,136,0.2); }
          50% { box-shadow: 0 0 40px rgba(0,255,136,0.4); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  app: {
    minHeight: '100vh',
    background: '#0a0a0f',
    color: '#fff',
  },
  loadingScreen: {
    minHeight: '100vh',
    background: '#0a0a0f',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  spinner: {
    width: 40,
    height: 40,
    border: '3px solid #1e1e2e',
    borderTop: '3px solid #00ff88',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontFamily: "'Syne', sans-serif",
    color: '#555',
    letterSpacing: 4,
    fontSize: 12,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 32px',
    borderBottom: '1px solid #1e1e2e',
    background: '#111118',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
  },
  logoGlow: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: '#00ff88',
    boxShadow: '0 0 12px rgba(0,255,136,0.6)',
  },
  logo: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: 4,
    margin: 0,
  },
  badge: {
    background: '#1e1e2e',
    color: '#00ff88',
    fontSize: 9,
    fontFamily: "'JetBrains Mono', monospace",
    padding: '4px 10px',
    borderRadius: 6,
    letterSpacing: 2,
  },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  loginBtn: {
    padding: '10px 24px',
    background: 'transparent',
    border: '1px solid #00ff88',
    borderRadius: 8,
    color: '#00ff88',
    fontSize: 12,
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 2,
    transition: 'all 0.2s ease',
  },
  main: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '40px 32px',
  },
  hero: {
    textAlign: 'center',
    padding: '80px 0',
  },
  heroTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 48,
    fontWeight: 700,
    letterSpacing: 6,
    marginBottom: 20,
    background: 'linear-gradient(135deg, #fff 0%, #00ff88 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroSub: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 14,
    color: '#666',
    maxWidth: 600,
    margin: '0 auto 40px',
    lineHeight: 1.8,
  },
  heroBtn: {
    padding: '16px 48px',
    background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
    border: 'none',
    borderRadius: 12,
    color: '#0a0a0f',
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "'Syne', sans-serif",
    cursor: 'pointer',
    letterSpacing: 3,
    boxShadow: '0 0 30px rgba(0,255,136,0.3)',
    transition: 'all 0.2s ease',
  },
  dashboard: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 24,
  },
  inputCard: {
    background: '#111118',
    border: '1px solid #1e1e2e',
    borderRadius: 16,
    padding: 28,
  },
  statusCard: {
    background: '#111118',
    border: '1px solid #1e1e2e',
    borderRadius: 16,
    padding: 28,
  },
  cardTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 14,
    fontWeight: 700,
    color: '#555',
    letterSpacing: 3,
    marginTop: 0,
    marginBottom: 20,
  },
  repoInput: {
    width: '100%',
    padding: '14px 16px',
    background: '#0a0a0f',
    border: '1px solid #1e1e2e',
    borderRadius: 10,
    color: '#fff',
    fontSize: 14,
    fontFamily: "'JetBrains Mono', monospace",
    outline: 'none',
    marginBottom: 16,
    boxSizing: 'border-box',
  },
  runBtn: {
    width: '100%',
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
    boxShadow: '0 0 20px rgba(0,255,136,0.3)',
    transition: 'all 0.2s ease',
  },
  runBtnRunning: {
    background: 'linear-gradient(135deg, #ffaa00 0%, #ff8800 100%)',
    animation: 'pulse 1.5s infinite',
    boxShadow: '0 0 20px rgba(255,170,0,0.3)',
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    transition: 'all 0.3s ease',
  },
  statusText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 14,
    letterSpacing: 2,
  },
  userInfo: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    color: '#555',
  },
};

export default App;
