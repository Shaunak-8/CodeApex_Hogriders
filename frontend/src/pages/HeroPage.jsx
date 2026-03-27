import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Cpu, Zap, Shield, GitBranch, ArrowRight } from 'lucide-react';

export default function HeroPage() {
  const navigate = useNavigate();
  const { user, initialize } = useAuth();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (user) {
      navigate('/app');
    }
  }, [user, navigate]);

  return (
    <div style={styles.page}>
      {/* Nav */}
      <nav style={styles.nav}>
        <div style={styles.navLeft}>
          <div style={styles.dot}></div>
          <span style={styles.brand}>HOGRIDERS</span>
          <span style={styles.badge}>CI/CD</span>
        </div>
        <button style={styles.navBtn} onClick={() => navigate('/auth')}>
          GET STARTED <ArrowRight size={14} />
        </button>
      </nav>

      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.glowOrb}></div>
        <p style={styles.eyebrow}>AUTONOMOUS CI/CD HEALING</p>
        <h1 style={styles.title}>
          Your Code Breaks.<br />
          <span style={styles.accent}>We Fix It.</span>
        </h1>
        <p style={styles.subtitle}>
          Multi-agent AI system that detects, analyzes, and fixes code failures
          in real-time. Powered by Groq Llama3-70B.
        </p>
        <div style={styles.ctas}>
          <button style={styles.primaryBtn} onClick={() => navigate('/auth')}>
            START HEALING <Zap size={16} />
          </button>
          <button style={styles.secondaryBtn} onClick={() => navigate('/auth?mode=signup')}>
            CREATE ACCOUNT
          </button>
        </div>
      </section>

      {/* Features */}
      <section style={styles.features}>
        {[
          { icon: <Cpu size={20} />, title: 'Multi-Agent Fleet', desc: '6 specialist agents route and fix failures by type.' },
          { icon: <Shield size={20} />, title: 'Auto-Validation', desc: 'Re-runs tests after every fix. Max 5 retries.' },
          { icon: <GitBranch size={20} />, title: 'Auto-Commit & Push', desc: 'Pushes fixes to a new branch with [AI-AGENT] prefix.' },
          { icon: <Zap size={20} />, title: 'Live Streaming', desc: 'Watch every agent decision in real-time via SSE.' },
        ].map((f, i) => (
          <div key={i} style={styles.featureCard}>
            <div style={styles.featureIcon}>{f.icon}</div>
            <h3 style={styles.featureTitle}>{f.title}</h3>
            <p style={styles.featureDesc}>{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <span style={{ color: '#333' }}>© 2026 Hogriders — Built for CodeApex</span>
      </footer>

      <style>{`
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        @keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 0.8; } }
      `}</style>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0a0a0f', color: '#fff', fontFamily: "'Syne', sans-serif", position: 'relative', overflow: 'hidden' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid #1a1a25' },
  navLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 12px #00ff88' },
  brand: { fontSize: 16, fontWeight: 800, letterSpacing: 3 },
  badge: { fontSize: 8, background: '#1e1e2e', color: '#00ff88', padding: '2px 6px', borderRadius: 4, letterSpacing: 1 },
  navBtn: { display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: '1px solid #00ff88', color: '#00ff88', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 600 },

  hero: { textAlign: 'center', padding: '100px 40px 80px', position: 'relative' },
  glowOrb: { position: 'absolute', top: '-120px', left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,255,136,0.08) 0%, transparent 70%)', animation: 'pulse 4s ease-in-out infinite', pointerEvents: 'none' },
  eyebrow: { fontSize: 10, letterSpacing: 4, color: '#00ff88', marginBottom: 20 },
  title: { fontSize: 56, lineHeight: 1.1, fontWeight: 900, letterSpacing: 2, margin: '0 auto 24px', maxWidth: 700 },
  accent: { background: 'linear-gradient(135deg, #00ff88, #00ccff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  subtitle: { color: '#666', fontSize: 14, maxWidth: 500, margin: '0 auto 40px', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.7 },
  ctas: { display: 'flex', gap: 16, justifyContent: 'center' },
  primaryBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '14px 36px', background: 'linear-gradient(135deg, #00ff88, #00cc6a)', color: '#000', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: 13 },
  secondaryBtn: { padding: '14px 36px', background: 'transparent', border: '1px solid #333', color: '#888', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 },

  features: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, padding: '0 40px 80px', maxWidth: 1200, margin: '0 auto' },
  featureCard: { background: '#111118', border: '1px solid #1e1e2e', borderRadius: 16, padding: 28, transition: 'border-color 0.2s' },
  featureIcon: { color: '#00ff88', marginBottom: 16 },
  featureTitle: { fontSize: 14, fontWeight: 700, marginBottom: 8, letterSpacing: 1 },
  featureDesc: { fontSize: 11, color: '#666', lineHeight: 1.6, fontFamily: "'JetBrains Mono', monospace" },

  footer: { textAlign: 'center', padding: 40, borderTop: '1px solid #1a1a25', fontSize: 11 },
};
