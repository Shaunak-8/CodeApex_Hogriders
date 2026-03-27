import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { logout } from '../lib/supabase';
import UserAvatar from './UserAvatar';

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/app', icon: LayoutDashboard },
    { name: 'Projects', path: '/app/projects', icon: FolderKanban },
    { name: 'Settings', path: '/app/settings', icon: Settings },
  ];

  return (
    <div style={styles.layout}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.brand} onClick={() => navigate('/app')}>
          <div style={styles.dot}></div>
          <span>HOGRIDERS</span>
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
                <Icon size={16} color={active ? '#00ff88' : '#555'} />
                <span style={{ color: active ? '#fff' : '#888' }}>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div style={styles.sidebarBottom}>
          <div style={styles.userBox}>
            {user && <UserAvatar/>}
            <div style={styles.userInfo}>
              <span style={styles.userName}>{user?.email?.split('@')[0]}</span>
              <span style={styles.userRole}>Admin</span>
            </div>
          </div>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const styles = {
  layout: { display: 'flex', height: '100vh', background: '#050508', fontFamily: "'Syne', sans-serif", color: '#fff', overflow: 'hidden' },
  sidebar: { width: 260, background: '#0a0a0f', borderRight: '1px solid #1e1e2e', display: 'flex', flexDirection: 'column', padding: '24px 16px' },
  brand: { display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', marginBottom: 40, cursor: 'pointer', fontSize: 16, fontWeight: 800, letterSpacing: 3 },
  dot: { width: 8, height: 8, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 10px #00ff88' },
  
  nav: { display: 'flex', flexDirection: 'column', gap: 8, flex: 1 },
  navBtn: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: '0.2s', textAlign: 'left' },
  navBtnActive: { background: '#111118', border: '1px solid #1e1e2e' },

  sidebarBottom: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 12px', borderTop: '1px solid #1e1e2e', marginTop: 'auto' },
  userBox: { display: 'flex', alignItems: 'center', gap: 10 },
  userInfo: { display: 'flex', flexDirection: 'column' },
  userName: { fontSize: 12, fontWeight: 700, color: '#fff' },
  userRole: { fontSize: 10, color: '#555', fontFamily: "'JetBrains Mono', monospace" },
  logoutBtn: { background: 'none', border: '1px solid #1e1e2e', color: '#555', borderRadius: 6, padding: '6px', cursor: 'pointer', display: 'flex' },

  main: { flex: 1, overflowY: 'auto' }
};
