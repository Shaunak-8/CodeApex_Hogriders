import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Cpu, Zap, Shield, GitBranch, ArrowRight, Network, Box, Lock, Activity, Terminal } from 'lucide-react';
import TypingTerminal from '../components/TypingTerminal';

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
          <span className="pixel-title-3d" style={{...styles.brand, fontSize: '18px !important', textShadow: '1px 1px 0 var(--green), 2px 2px 0 #000', WebkitTextStroke: '0.5px black'}}>MCLOVIN</span>
        </div>
        <div style={styles.navCenter}>
            <button style={styles.navLink} onClick={() => navigate('/network')}>NETWORK</button>
            <button style={styles.navLink} onClick={() => navigate('/core')}>CORE</button>
            <button style={styles.navLink} onClick={() => navigate('/protocol')}>PROTOCOL</button>
            <button style={styles.navLink} onClick={() => navigate('/docs')}>DOCS</button>
        </div>
        <div style={styles.navRight}>
          <button style={styles.authLink} onClick={() => navigate('/auth')}>SIGN IN</button>
          <button style={styles.navBtn} onClick={() => navigate('/auth?mode=signup')}>
            SIGN UP
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
            <div className="text-thick" style={styles.statusBadge}>
                <div style={styles.statusPulse}></div>
                <span>SYSTEM ONLINE // V3.0.0</span>
            </div>
            <h1 style={styles.title}>
              <span className="pixel-white-2d">THE SELF-</span><br />
              <span className="pixel-white-2d">HEALING </span><span className="pixel-title-green-3d">CODE</span><br />
              <span className="pixel-title-green-3d">MCLOVIN</span><span className="pixel-white-2d"> AGENT.</span>
            </h1>
            <p className="text-thick" style={styles.subtitle}>
            Automated codebase optimization through decentralized orchestration. 
            Secure, low-latency, and architected for the next generation of autonomous engineering.
            </p>
            <div style={styles.ctas}>
                <button className="text-thick" style={styles.primaryBtn} onClick={() => navigate('/auth')}>
                    GET STARTED <ArrowRight size={16} />
                </button>
                <button className="text-thick" style={styles.secondaryBtn} onClick={() => navigate('/auth')}>
                    READ DOCUMENTATION
                </button>
            </div>
        </div>
        
        {/* Terminal Graphic */}
        <div style={styles.terminalContainer}>
            <div style={styles.terminalHeader}>
                <span style={styles.terminalTitle}>TERMINAL_OUTPUT_01</span>
                <span style={styles.terminalStatus}>STATUS: OPERATING</span>
            </div>
            <div style={styles.terminalBody}>
                <TypingTerminal />
                <div style={styles.termPulseGrid}>
                    <div style={styles.pulseBox}></div>
                    <div style={styles.pulseBox}></div>
                    <div style={styles.pulseBox}></div>
                    <div style={styles.pulseBox}></div>
                    <div style={{...styles.pulseBox, background: '#00ff8844'}}></div>
                </div>
            </div>
        </div>
      </section>

      {/* Architecture Modules */}
      <section style={styles.modules}>
        <div style={styles.sectionHeader}>
            <span style={styles.sectionEyebrow}>MODULES</span>
            <h2 style={styles.sectionTitle}>SYSTEM ARCHITECTURE</h2>
            <span style={styles.moduleCount}>TOTAL NODES ACTIVE: 14,892</span>
        </div>

        <div style={styles.moduleGrid}>
            {[
                { icon: <img src="/assets/mclovin-icon.png" alt="Mesh" style={{ width: 42, height: 42, objectFit: 'contain', mixBlendMode: 'multiply', animation: 'float 3s ease-in-out infinite' }} />, title: 'MESH NETWORK', desc: 'Decentralized orchestration layer providing infinite scale and zero single-point failure architecture.', status: 'ACTIVE', color: 'var(--green)' },
                { icon: <img src="/assets/mclovin-icon.png" alt="Neural" style={{ width: 42, height: 42, objectFit: 'contain', mixBlendMode: 'multiply', animation: 'float 3s ease-in-out infinite', animationDelay: '0.5s' }} />, title: 'NEURAL CORE', desc: 'Self-learning algorithms that predict codebase drift and preemptively optimize execution paths.', status: 'SYNCING', color: 'var(--green)' },
                { icon: <img src="/assets/mclovin-icon.png" alt="Vault" style={{ width: 42, height: 42, objectFit: 'contain', mixBlendMode: 'multiply', animation: 'float 3s ease-in-out infinite', animationDelay: '1s' }} />, title: 'VAULT PROTOCOL', desc: 'Zero-trust hardware-level encryption protecting every byte of your intellectual property.', status: 'SECURE', color: 'var(--cyan)' },
            ].map((m, i) => (
                <div key={i} style={styles.moduleCard}>
                    <div style={styles.moduleTop}>
                        <div style={{...styles.moduleIcon, color: m.color}}>{m.icon}</div>
                        <span style={{...styles.moduleStatus, background: `${m.color}11`, color: m.color, borderColor: `${m.color}33`}}>{m.status}</span>
                    </div>
                    <h3 className="pixel-green-white-3d" style={styles.moduleTitle}>{m.title}</h3>
                    <p className="text-thick" style={styles.moduleDesc}>{m.desc}</p>
                    <div style={styles.moduleMeta}>
                        {i === 0 && <span style={styles.metaLabel}>LATENCY: <span style={styles.metaVal}>4ms</span></span>}
                        {i === 1 && <span style={styles.metaLabel}>THROUGHPUT: <span style={styles.metaVal}>1.2TB/s</span></span>}
                        {i === 2 && <span style={styles.metaLabel}>ENCRYPTION: <span style={styles.metaVal}>AES-X</span></span>}
                    </div>
                </div>
            ))}
        </div>
      </section>

      {/* Latency Report */}
      <section style={styles.latencySection}>
        <div style={styles.latencyCard}>
            <div style={styles.latencyHeader}>
                <h3 className="text-thick" style={styles.latTitle}>GLOBAL_LATENCY_REPORT</h3>
                <p className="text-thick" style={styles.latSub}>Real-time network performance across the McLovin backbone. Our proprietary Protocol-X ensures sub-10ms response times worldwide.</p>
                <button 
                  style={styles.latLink} 
                  onClick={() => navigate('/app/status')}
                >
                  VIEW FULL SYSTEM STATUS <ArrowRight size={12} />
                </button>
            </div>
            <div style={styles.latencyGrid}>
                {[
                    { node: 'NORTH_AMERICA_EAST', ping: '12ms' },
                    { node: 'EUROPE_CENTRAL', ping: '18ms' },
                    { node: 'ASIA_PACIFIC_SOUTH', ping: '34ms' },
                    { node: 'SOUTH_AMERICA_EAST', ping: '29ms' },
                ].map((l, i) => (
                    <div key={i} style={styles.latRow}>
                        <div style={styles.latNode}>
                            <div style={styles.latDot}></div>
                            <span className="text-thick">{l.node}</span>
                        </div>
                        <span className="text-thick" style={styles.latPing}>{l.ping}</span>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={styles.finalCta}>
        <h2 style={styles.finalTitle}>READY TO ACHIEVE <span style={styles.accent}>TERMINAL VELOCITY?</span></h2>
        <p style={styles.finalSub}>Join 2,400+ enterprises optimizing their deployment pipelines with autonomous agents.</p>
        <button style={styles.launchBtn} onClick={() => navigate('/auth')}>
            INITIALIZE DEPLOYMENT
        </button>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerBrand}>MCLOVIN</div>
        <div style={styles.footerLinks}>
            <button style={styles.footLink} onClick={() => navigate('/terminal')}>TERMINAL</button>
            <button style={styles.footLink} onClick={() => navigate('/latency')}>LATENCY_REPORT</button>
            <button style={styles.footLink} onClick={() => navigate('/vault')}>VAULT_STAT</button>
            <button style={styles.footLink} onClick={() => navigate('/logs')}>SYSTEM_LOGS</button>
        </div>
        <div style={styles.footerCopy}>©2024 EDGE_APEX // TERMINAL_VELOCITY_V1.0.0</div>
      </footer>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: 'transparent', color: '#fff', fontFamily: "var(--font-heading)", position: 'relative', overflowX: 'hidden' },

  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 40px', background: 'rgba(5,5,8,0.4)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, zIndex: 1000 },
  navLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  dot: { width: 10, height: 10, background: 'var(--green)', boxShadow: '0 0 10px var(--green)', borderRadius: '2px' },
  brand: { fontSize: 18, fontWeight: 800, letterSpacing: 2, color: 'var(--green)', fontFamily: 'var(--font-heading)', WebkitTextStroke: '0.5px black' },
  navCenter: { display: 'flex', gap: 32 },
  navLink: { background: 'none', border: 'none', fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'var(--text-secondary)', cursor: 'pointer', transition: '0.3s', padding: 0, fontFamily: 'var(--font-heading)' },
  navRight: { display: 'flex', alignItems: 'center', gap: 24 },
  authLink: { background: 'none', border: 'none', fontSize: 10, fontWeight: 700, letterSpacing: 2, cursor: 'pointer', color: 'var(--text-primary)', padding: 0, fontFamily: 'var(--font-heading)' },
  navBtn: { background: 'var(--green)', color: '#000', border: 'none', padding: '8px 20px', borderRadius: 4, cursor: 'pointer', fontSize: 10, fontWeight: 800, letterSpacing: 1 },

  hero: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 80px 100px', maxWidth: 1400, margin: '0 auto', gap: 60, position: 'relative', zIndex: 10 },
  heroContent: { flex: 1 },
  statusBadge: { display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0, 255, 136, 0.05)', padding: '6px 12px', borderRadius: 4, width: 'fit-content', marginBottom: 32, fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'var(--green)', border: '1px solid rgba(0, 255, 136, 0.1)' },
  statusPulse: { width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)', animation: 'pulse 2s infinite' },
  title: { fontSize: 60, lineHeight: 1.1, fontWeight: 800, letterSpacing: -1.5, marginBottom: 32, textShadow: '0 4px 20px rgba(0,0,0,1)' },
  accent: { color: 'var(--green)' },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 16, maxWidth: 500, marginBottom: 48, fontFamily: "var(--font-mono)", lineHeight: 1.6, textShadow: '0 2px 10px rgba(0,0,0,1)' },
  ctas: { display: 'flex', gap: 20 },
  primaryBtn: { display: 'flex', alignItems: 'center', gap: 12, padding: '16px 32px', background: 'var(--green)', color: '#000', border: 'none', borderRadius: 4, fontWeight: 800, cursor: 'pointer', fontSize: 14 },
  secondaryBtn: { padding: '16px 32px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border)', color: '#fff', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 700, backdropFilter: 'blur(10px)' },

  terminalContainer: { flex: 1, background: 'rgba(10, 10, 15, 0.8)', backdropFilter: 'blur(12px)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' },
  terminalHeader: { padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(13, 13, 20, 0.9)' },
  terminalTitle: { fontSize: 9, color: 'var(--text-secondary)', letterSpacing: 1 },
  terminalStatus: { fontSize: 9, color: 'var(--green)', fontWeight: 700, WebkitTextStroke: '0.5px black' },
  terminalBody: { padding: 32, minHeight: 500, fontFamily: "var(--font-mono)", fontSize: 13, color: 'var(--green)', WebkitTextStroke: '0.5px black' },
  termLine: { marginBottom: 16, display: 'flex', gap: 12 },
  termPrompt: { color: 'var(--text-secondary)' },
  termDim: { color: 'var(--text-secondary)' },
  termSuccess: { color: 'var(--green)', WebkitTextStroke: '0.5px black' },
  termAction: { color: 'var(--cyan)' },
  termPulseGrid: { display: 'flex', gap: 6, marginTop: 20 },
  pulseBox: { width: 12, height: 12, border: '1px solid var(--green)', opacity: 0.3 },

  modules: { padding: '100px 80px', maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 10 },
  sectionHeader: { marginBottom: 60, position: 'relative' },
  sectionEyebrow: { fontSize: 10, letterSpacing: 4, color: 'var(--green)', marginBottom: 16, display: 'block', WebkitTextStroke: '0.5px black' },
  sectionTitle: { fontSize: 32, fontWeight: 800, letterSpacing: 2, textShadow: '0 2px 10px rgba(0,0,0,1)' },
  moduleCount: { position: 'absolute', right: 0, bottom: 0, fontSize: 10, color: 'var(--text-secondary)', fontFamily: "var(--font-mono)" },
  moduleGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 },
  moduleCard: { background: 'rgba(10, 10, 15, 0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.05)', padding: 32, borderRadius: 4, position: 'relative', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' },
  moduleTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  moduleIcon: { color: 'var(--green)' },
  moduleStatus: { fontSize: 8, padding: '3px 8px', borderRadius: 4, fontWeight: 700, border: '1px solid transparent' },
  moduleTitle: { fontSize: 16, fontWeight: 800, marginBottom: 12, letterSpacing: 1 },
  moduleDesc: { fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 24, fontFamily: "var(--font-mono)" },
  moduleMeta: { fontSize: 9, color: 'rgba(255,255,255,0.5)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16, display: 'flex', alignItems: 'center', gap: 4 },
  metaLabel: { color: 'rgba(255,255,255,0.5)' },
  metaVal: { color: 'var(--green)', fontWeight: 700, WebkitTextStroke: '0.5px black' },

  latencySection: { padding: '0 80px 100px', maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 10 },
  latencyCard: { background: 'rgba(10, 10, 15, 0.6)', backdropFilter: 'blur(12px)', borderLeft: '3px solid var(--green)', borderTop: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '40px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 80, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' },
  latencyHeader: { flex: 1 },
  latTitle: { fontSize: 20, fontWeight: 800, marginBottom: 16, letterSpacing: 2, textShadow: '0 2px 10px rgba(0,0,0,1)' },
  latSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.6, marginBottom: 24, fontFamily: "var(--font-mono)" },
  latLink: { background: 'none', border: 'none', padding: 0, fontSize: 10, color: 'var(--green)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', WebkitTextStroke: '0.5px black', fontFamily: 'var(--font-mono)' },
  latencyGrid: { flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 60px' },
  latRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 12 },
  latNode: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600 },
  latDot: { width: 4, height: 4, background: 'var(--green)', borderRadius: '1px' },
  latPing: { fontSize: 12, color: 'var(--green)', fontWeight: 700, fontFamily: "var(--font-mono)", WebkitTextStroke: '0.5px black' },

  finalCta: { textAlign: 'center', padding: '160px 40px', background: 'radial-gradient(circle at center, rgba(0, 255, 136, 0.05) 0%, transparent 70%)', position: 'relative', zIndex: 10 },
  finalTitle: { fontSize: 48, fontWeight: 800, marginBottom: 24, textShadow: '0 4px 20px rgba(0,0,0,1)' },
  finalSub: { color: 'rgba(255,255,255,0.7)', fontSize: 16, marginBottom: 48, maxWidth: 600, margin: '0 auto 48px', textShadow: '0 2px 10px rgba(0,0,0,1)' },
  launchBtn: { background: 'var(--green)', color: '#000', border: 'none', padding: '18px 48px', borderRadius: 4, fontWeight: 800, fontSize: 16, cursor: 'pointer' },

  footer: { padding: '40px 80px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' },
  footerBrand: { color: 'var(--green)', fontWeight: 800, fontSize: 16, letterSpacing: 2, WebkitTextStroke: '0.5px black' },
  footerLinks: { display: 'flex', gap: 32, fontSize: 9, fontWeight: 700, letterSpacing: 1, color: 'rgba(255,255,255,0.4)' },
  footerCopy: { fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: "var(--font-mono)" },

  // Floating animation for McLovin icons
  '@keyframes float': {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-8px)' },
  }
};

