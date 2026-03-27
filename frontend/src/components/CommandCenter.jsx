import { useEffect, useState, useRef } from 'react';
import { Terminal as TerminalIcon, Cpu, Activity } from 'lucide-react';

export default function CommandCenter() {
  const [logs, setLogs] = useState([
    { id: 1, time: new Date().toLocaleTimeString(), source: 'System', msg: 'Command Center initialized...', type: 'info' },
    { id: 2, time: new Date().toLocaleTimeString(), source: 'ReviewAgent', msg: 'Monitoring active repositories for pushes...', type: 'success' },
  ]);
  const logEndRef = useRef(null);

  useEffect(() => {
    const eventSource = new EventSource(`${import.meta.env.VITE_API_URL}/stream/global`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLogs(prev => [...prev.slice(-49), {
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        source: data.agent,
        msg: data.message,
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
        <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
            <TerminalIcon size={14} color="#00ff88" />
            <span style={styles.title}>PLATFORM COMMAND CENTER</span>
        </div>
        <div style={styles.status}>
            <div style={styles.pulse}></div>
            <span>LIVE STREAMING</span>
        </div>
      </div>
      
      <div style={styles.terminal}>
        {logs.map(log => (
            <div key={log.id} style={styles.line}>
                <span style={styles.time}>[{log.time}]</span>
                <span style={{...styles.source, color: log.type === 'error' ? '#ff3b3b' : '#00ff88'}}>{log.source}</span>
                <span style={styles.msg}>{log.msg}</span>
            </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}

const styles = {
  container: { background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  header: { padding: '12px 16px', background: '#111118', borderBottom: '1px solid #1e1e2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 10, fontWeight: 800, letterSpacing: 1, color: '#888' },
  status: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 9, fontWeight: 700, color: '#00ff88', letterSpacing: 1 },
  pulse: { width: 6, height: 6, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 5px #00ff88' },
  
  terminal: { padding: 16, height: 300, overflowY: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, background: '#050508' },
  line: { marginBottom: 6, display: 'flex', gap: 10, lineHeight: 1.4 },
  time: { color: '#444' },
  source: { fontWeight: 700, minWidth: 100 },
  msg: { color: '#aaa', flex: 1, wordBreak: 'break-all' }
};
