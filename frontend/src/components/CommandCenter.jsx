import { useEffect, useState, useRef } from 'react';
import { Terminal as TerminalIcon, Cpu, Activity, Shield, Zap } from 'lucide-react';

export default function CommandCenter() {
  const [logs, setLogs] = useState([
    { id: 1, time: new Date().toLocaleTimeString(), source: 'SYSTEM', msg: 'COMMAND_CENTER_INITIALIZED...', type: 'info' },
    { id: 2, time: new Date().toLocaleTimeString(), source: 'MCLOVIN_CORE', msg: 'SYNCING_WITH_GLOBAL_VULNERABILITY_DATABASE...', type: 'success' },
    { id: 3, time: new Date().toLocaleTimeString(), source: 'UPLINK', msg: 'ENCRYPTED_CHANNEL_ESTABLISHED_RSA_4096', type: 'info' },
  ]);
  const logEndRef = useRef(null);

  useEffect(() => {
    const streamBase = import.meta.env.VITE_API_URL || window.location.origin;
    const eventSource = new EventSource(`${streamBase}/stream/global`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLogs(prev => [...prev.slice(-49), {
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        source: data.agent.toUpperCase(),
        msg: data.message.toUpperCase(),
        type: data.type === 'ISSUE_DETECTED' ? 'error' : 'info'
      }]);
    };

    return () => eventSource.close();
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <TerminalIcon size={14} color="var(--green)" />
            <h3 style={styles.title}>SUBSYSTEM_MONITOR</h3>
        </div>
        <div style={styles.status}>
            <div style={styles.pulse}></div>
            <span>UPLINK_LIVE</span>
        </div>
      </div>
      
      <div style={styles.terminal}>
        <div style={styles.scanline}></div>
        {logs.map(log => (
            <div key={log.id} style={styles.line}>
                <span style={styles.time}>[{log.time}]</span>
                <div style={styles.sourceWrap}>
                    <span style={{...styles.source, color: log.type === 'error' ? 'var(--red)' : 'var(--green)'}}>{log.source}</span>
                    <span style={styles.divider}>»</span>
                </div>
                <span style={{...styles.msg, color: log.type === 'error' ? 'var(--red)' : '#888'}}>{log.msg}</span>
            </div>
        ))}
        <div ref={logEndRef} />
      </div>

      <div style={styles.footer}>
        <div style={styles.footerItem}>
            <Cpu size={10} color="var(--text-secondary)" />
            <span>LOAD: 0.04</span>
        </div>
        <div style={styles.footerItem}>
            <Shield size={10} color="var(--text-secondary)" />
            <span>SEC: COMPLIANT</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' },
  header: { padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 10, fontWeight: 800, letterSpacing: 2, color: 'var(--text-primary)' },
  status: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, fontWeight: 800, color: 'var(--green)', letterSpacing: 1 },
  pulse: { width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)', animation: 'pulse 2s infinite' },
  
  terminal: { padding: 24, flex: 1, minHeight: 450, overflowY: 'auto', fontFamily: "var(--font-mono)", fontSize: 11, background: 'rgba(0,0,0,0.4)', position: 'relative' },
  scanline: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(0, 255, 136, 0.02) 50%)', backgroundSize: '100% 4px', pointerEvents: 'none', zIndex: 1 },
  
  line: { marginBottom: 8, display: 'flex', gap: 12, lineHeight: 1.5, position: 'relative', zIndex: 2 },
  time: { color: 'var(--text-secondary)', opacity: 0.5 },
  sourceWrap: { display: 'flex', alignItems: 'center', gap: 6, minWidth: 120 },
  source: { fontWeight: 800, letterSpacing: 1 },
  divider: { color: 'var(--text-secondary)', opacity: 0.3 },
  msg: { flex: 1, wordBreak: 'break-all', letterSpacing: 0.5 },

  footer: { padding: '12px 20px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--border)', display: 'flex', gap: 24 },
  footerItem: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 8, color: 'var(--text-secondary)', fontWeight: 700, fontFamily: "var(--font-mono)" }
};
