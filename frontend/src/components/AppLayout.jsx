import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Settings, LogOut, Activity, Shield, Terminal, Cpu } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { name: 'DASHBOARD', path: '/app', icon: LayoutDashboard },
    { name: 'REPOSITORY', path: '/app/projects', icon: FolderKanban },
    { name: 'SETTINGS', path: '/app/settings', icon: Settings },
  ];

  return (
    <div style={styles.layout}>
      {/* Grid Overlay for whole app */}
      <div style={styles.gridOverlay}></div>

      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.brand} onClick={() => navigate('/app')}>
          <div style={styles.dot}></div>
          <span>MCLOVIN</span>
        </div>

        <div style={styles.sysInfo}>
          <div style={styles.sysRow}>
            <span style={styles.sysLabel}>NODE_ID:</span>
            <span style={styles.sysVal}>APEX_PRIME_01</span>
          </div>
          <div style={styles.sysRow}>
            <span style={styles.sysLabel}>ENCRYPTION:</span>
            <span style={styles.sysVal}>RSA_4096</span>
          </div>
        </div>

        <nav style={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path || (item.path !== '/app' && location.pathname.startsWith(item.path));
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                style={{ ...styles.navBtn, ...(active ? styles.navBtnActive : {}) }}
              >
                {active && <div style={styles.activeIndicator}></div>}
                <Icon size={16} color={active ? 'var(--green)' : '#333'} />
                <span style={{ color: active ? '#fff' : 'var(--text-secondary)' }}>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div style={styles.sidebarBottom}>
          <div style={styles.userSection}>
            <div style={styles.avatar}>
                <div style={styles.avatarInner}>
                    <Cpu size={14} color="var(--green)" />
                </div>
            </div>
            <div style={styles.userDetails}>
              <span style={styles.userName}>{(user?.email ?? 'ANONYMOUS').split('@')[0].toUpperCase()}</span>
              <span style={styles.userRole}>SEC_LEVEL_04</span>
            </div>
          </div>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>
        <header style={styles.topHeader}>
            <div style={styles.statusGroup}>
                <div style={styles.statusPulse}></div>
                <span style={styles.statusText}>SYSTEM_UPLINK: ACTIVE</span>
            </div>
            <div style={styles.headerRight}>
                <span style={styles.latency}>LATENCY: 4ms</span>
                <div style={styles.divider}></div>
                <span style={styles.version}>V3.0.0_STARK</span>
            </div>
        </header>
        <div style={styles.content}>
            <Outlet />
        </div>
      </main>
    </div>
  );
}

const styles = {
  layout: { display: 'flex', height: '100vh', background: 'var(--bg)', fontFamily: "var(--font-heading)", color: '#fff', overflow: 'hidden', position: 'relative' },
  gridOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundSize: '100px 100px', backgroundImage: 'linear-gradient(rgba(30, 30, 46, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 30, 46, 0.05) 1px, transparent 1px)', pointerEvents: 'none', zIndex: 0 },
  
  sidebar: { width: 260, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '40px 16px', zIndex: 10, position: 'relative' },
  brand: { display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px', marginBottom: 12, cursor: 'pointer', fontSize: 18, fontWeight: 800, letterSpacing: 4, color: 'var(--green)' },
  dot: { width: 8, height: 8, background: 'var(--green)', boxShadow: '0 0 10px var(--green)', borderRadius: '15%' },
  
  sysInfo: { padding: '12px', marginBottom: 48, background: 'rgba(0,0,0,0.2)', borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 4 },
  sysRow: { display: 'flex', justifyContent: 'space-between', fontSize: 8, letterSpacing: 1, fontFamily: "var(--font-mono)" },
  sysLabel: { color: 'var(--text-secondary)' },
  sysVal: { color: 'var(--green)', fontWeight: 700 },

  nav: { display: 'flex', flexDirection: 'column', gap: 8, flex: 1 },
  navBtn: { position: 'relative', display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, transition: '0.3s', textAlign: 'left', letterSpacing: 2, borderRadius: 2 },
  navBtnActive: { background: 'rgba(0, 255, 136, 0.03)' },
  activeIndicator: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: 'var(--green)', boxShadow: '0 0 10px var(--green)' },

  sidebarBottom: { marginTop: 'auto', paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 12px' },
  userSection: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: { width: 32, height: 32, borderRadius: 2, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' },
  avatarInner: { width: 24, height: 24, borderRadius: 1, background: 'rgba(0, 255, 136, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  userDetails: { display: 'flex', flexDirection: 'column' },
  userName: { fontSize: 11, fontWeight: 800, color: '#fff', letterSpacing: 1 },
  userRole: { fontSize: 8, color: 'var(--text-secondary)', fontFamily: "var(--font-mono)", marginTop: 2 },
  logoutBtn: { background: 'none', border: '1px solid var(--border)', color: '#555', borderRadius: 2, padding: '6px', cursor: 'pointer', display: 'flex', transition: '0.3s' },

  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 5, position: 'relative' },
  topHeader: { height: 60, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', background: 'rgba(5,5,8,0.5)', backdropFilter: 'blur(5px)' },
  statusGroup: { display: 'flex', alignItems: 'center', gap: 12 },
  statusPulse: { width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)' },
  statusText: { fontSize: 9, letterSpacing: 2, color: 'var(--green)', fontWeight: 700 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 20, fontSize: 8, fontFamily: "var(--font-mono)", color: 'var(--text-secondary)' },
  latency: { color: 'var(--cyan)' },
  divider: { width: 1, height: 12, background: 'var(--border)' },
  version: { opacity: 0.5 },
  content: { flex: 1, overflowY: 'auto', background: 'transparent' }
};
