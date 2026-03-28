import { useRef, useEffect } from 'react';
import { Terminal, Activity } from 'lucide-react';

const agentColors = {
  orchestratoragent: 'var(--green)',
  analyzeragent: 'var(--cyan)',
  validatoragent: '#ffaa00',
  reporteragent: '#a855f7',
  gitagent: 'var(--red)',
  pythonfixeragent: '#3b82f6',
  typefixeragent: '#06b6d4',
  syntaxfixeragent: '#f59e0b',
  logicfixeragent: '#ef4444',
  importfixeragent: '#8b5cf6',
  jsfixeragent: '#f97316',
};

export default function AgentThoughtStream({ thoughts }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thoughts]);

  const renderMessage = (msg) => {
    if (typeof msg !== 'string') return JSON.stringify(msg);
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = msg.split(urlRegex);
    return parts.map((part, i) =>
      urlRegex.test(part) ? (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={styles.link}>
          {part}
        </a>
      ) : part
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.terminal}>
        <div style={styles.scanline}></div>

        {thoughts.length === 0 && (
          <div style={styles.empty}>
            <Activity size={16} color="var(--text-secondary)" className="pulse" />
            <span style={styles.muted}>WAITING_FOR_UPLINK_ACTIVITY...</span>
          </div>
        )}

        {thoughts.map((t, i) => {
          const isSuccess =
            t.message?.includes('SUCCESS') || t.type === 'COMMIT_DONE';
          const agentKey = String(t.agent || '').toLowerCase();

          return (
            <div
              key={i}
              style={{
                ...styles.line,
                background: isSuccess ? '#00ff880a' : 'transparent',
                borderRadius: 4,
                padding: '2px 4px',
              }}
            >
              <div style={styles.timeWrap}>
                <span style={styles.time}>
                  {t.timestamp
                    ? new Date(t.timestamp).toLocaleTimeString([], {
                        hour12: false,
                      })
                    : '--:--:--'}
                </span>
              </div>

              <div style={styles.content}>
                <span
                  style={{
                    ...styles.agent,
                    color: agentColors[agentKey] || 'var(--text-secondary)',
                  }}
                >
                  [{String(t.agent || 'AGENT').toUpperCase()}]
                </span>

                <span
                  style={{
                    ...styles.msg,
                    color: isSuccess
                      ? '#00ff88'
                      : t.type === 'error'
                      ? 'var(--red)'
                      : '#bbb',
                  }}
                >
                  {renderMessage(t.message)}
                </span>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 2,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  terminal: {
    padding: 24,
    minHeight: 400,
    maxHeight: 600,
    overflowY: 'auto',
    fontFamily: 'var(--font-mono)',
    background: 'rgba(0,0,0,0.4)',
    position: 'relative',
  },
  scanline: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(to bottom, transparent 50%, rgba(0, 255, 136, 0.01) 50%)',
    backgroundSize: '100% 4px',
    pointerEvents: 'none',
    zIndex: 1,
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    gap: 16,
    opacity: 0.3,
  },
  muted: {
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: 800,
    color: 'var(--text-secondary)',
  },
  line: {
    display: 'flex',
    gap: 16,
    marginBottom: 10,
    fontSize: 11,
    lineHeight: 1.5,
    position: 'relative',
    zIndex: 2,
  },
  timeWrap: {
    width: 70,
    flexShrink: 0,
  },
  time: {
    color: 'var(--text-secondary)',
    opacity: 0.4,
    fontSize: 9,
  },
  content: {
    display: 'flex',
    gap: 10,
    flex: 1,
  },
  agent: {
    fontWeight: 900,
    whiteSpace: 'nowrap',
    fontSize: 9,
    letterSpacing: 1,
  },
  msg: {
    flex: 1,
    wordBreak: 'break-word',
    letterSpacing: 0.5,
  },
  link: {
    color: '#00ccff',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
};