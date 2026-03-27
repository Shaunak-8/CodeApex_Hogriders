import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Server, FileCode, Terminal, Download, Loader, CheckCircle2 } from 'lucide-react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

export default function InfrastructurePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  
  const [infra, setInfra] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateInfra = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/workspace/infra`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({ project_id: id }),
      });
      const data = await res.json();
      setInfra(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (infra) {
      hljs.highlightAll();
    }
  }, [infra]);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}><Server size={24} color="#00ff88" style={{marginRight: 10}}/> Infra Assistant</h1>
          <p style={styles.sub}>AI-Generated Deployment Configurations</p>
        </div>
        <button style={styles.backBtn} onClick={() => navigate(`/app/project/${id}`)}>
            Back to Dashboard
        </button>
      </header>

      {!infra && !loading && (
        <div style={styles.emptyState}>
            <div style={styles.iconCircle}><FileCode size={40} color="#555" /></div>
            <h2 style={{marginTop: 20}}>No Infrastructure Config Found</h2>
            <p style={{color: '#888', maxWidth: 400, textAlign: 'center', marginBottom: 24}}>
                Generate optimized Dockerfiles and CI/CD pipelines specifically tailored for this project's architecture.
            </p>
            <button style={styles.generateBtn} onClick={generateInfra}>
                Generate Configurations
            </button>
        </div>
      )}

      {loading && (
        <div style={styles.loadingBox}>
            <Loader size={32} className="spin" color="#00ff88" />
            <p>Analyzing tech stack and architecting containers...</p>
        </div>
      )}

      {infra && (
        <div style={styles.infraLayout}>
            <div style={styles.codePanel}>
                <div style={styles.panelHeader}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                        <Terminal size={14} color="#00ff88"/>
                        <span>Dockerfile</span>
                    </div>
                </div>
                <pre style={styles.pre}><code className="language-dockerfile">{infra.dockerfile}</code></pre>
            </div>
            <div style={styles.codePanel}>
                <div style={styles.panelHeader}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                        <CheckCircle2 size={14} color="#00ff88"/>
                        <span>GitHub Actions</span>
                    </div>
                </div>
                <pre style={styles.pre}><code className="language-yaml">{infra.github_actions}</code></pre>
            </div>
        </div>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const styles = {
  page: { padding: '32px', display: 'flex', flexDirection: 'column', height: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexShrink: 0 },
  title: { fontSize: 24, fontWeight: 800, letterSpacing: 1, marginBottom: 8, display: 'flex', alignItems: 'center' },
  sub: { fontSize: 13, color: '#888', fontFamily: "'JetBrains Mono', monospace" },
  backBtn: { padding: '8px 16px', borderRadius: 8, border: '1px solid #1e1e2e', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 12 },

  emptyState: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  iconCircle: { width: 100, height: 100, borderRadius: '50%', background: '#111118', border: '1px solid #1e1e2e', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  generateBtn: { padding: '12px 24px', background: '#00ff88', border: 'none', color: '#000', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 },

  loadingBox: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, color: '#555', fontSize: 13 },

  infraLayout: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, flex: 1, overflow: 'hidden' },
  codePanel: { background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  panelHeader: { padding: '12px 16px', background: '#111118', borderBottom: '1px solid #1e1e2e', fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: 1 },
  pre: { flex: 1, margin: 0, padding: 20, overflow: 'auto', fontSize: 12, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6 }
};
