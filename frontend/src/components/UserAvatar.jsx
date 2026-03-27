import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function UserAvatar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  const avatarUrl = user.user_metadata?.avatar_url;
  const name = user.user_metadata?.full_name || user.email || 'User';

  return (
    <div ref={ref} style={styles.container}>
      <button style={styles.avatarBtn} onClick={() => setOpen(!open)}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="avatar" style={styles.avatar} />
        ) : (
          <div style={styles.avatarFallback}>{name[0].toUpperCase()}</div>
        )}
      </button>
      {open && (
        <div style={styles.dropdown}>
          <p style={styles.name}>{name}</p>
          <p style={styles.email}>{user.email}</p>
          <button style={styles.logoutBtn} onClick={logout}>LOGOUT</button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { position: 'relative' },
  avatarBtn: {
    background: 'none',
    border: '2px solid #1e1e2e',
    borderRadius: '50%',
    padding: 0,
    cursor: 'pointer',
    width: 40,
    height: 40,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' },
  avatarFallback: {
    width: '100%',
    height: '100%',
    background: '#1e1e2e',
    color: '#00ff88',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 16,
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    right: 0,
    background: '#111118',
    border: '1px solid #1e1e2e',
    borderRadius: 12,
    padding: '16px 20px',
    minWidth: 200,
    zIndex: 100,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  },
  name: {
    color: '#fff',
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 14,
    margin: '0 0 4px',
  },
  email: {
    color: '#666',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    margin: '0 0 16px',
  },
  logoutBtn: {
    width: '100%',
    padding: '10px',
    background: '#1e1e2e',
    border: '1px solid #2a2a3a',
    borderRadius: 8,
    color: '#ff3b3b',
    fontSize: 12,
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 2,
  },
};
