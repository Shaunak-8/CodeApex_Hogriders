import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getProjects } from '../lib/api';
import { useAgentStore } from '../store/agentStore';
import { FolderGit2, Calendar, GitCommit, AlertTriangle, Plus, Loader } from 'lucide-react';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const setProjectId = useAgentStore(s => s.setProjectId);
  const setRepoUrl = useAgentStore(s => s.setRepoUrl);
  const reset = useAgentStore(s => s.reset);

  useEffect(() => {
    async function fetchProjects() {
      if (!session?.access_token) return;
      try {
        const data = await getProjects();
        setProjects(data.projects || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, [session]);

  const handleOpenProject = (p) => {
    reset();
    setProjectId(p.id);
    setRepoUrl(p.repo_url);
    navigate(`/app/project/${p.id}`);
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Projects</h1>
          <p style={styles.sub}>Manage your connected repositories and CI/CD pipelines.</p>
        </div>
        <button style={styles.newBtn} onClick={() => navigate('/connect-repo')}>
          <Plus size={16} /> New Project
        </button>
      </header>

      {loading ? (
        <div style={styles.center}><Loader size={24} className="spin" color="#00ff88" /></div>
      ) : projects.length === 0 ? (
        <div style={styles.empty}>
          <FolderGit2 size={48} color="#333" />
          <p>No projects connected yet.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {projects.map(p => (
            <Link 
              key={p.id} 
              to={`/app/project/${p.id}`}
              style={styles.card} 
              className="project-card"
              aria-label={`Open project ${p.name}`}
              onClick={() => {
                reset();
                setProjectId(p.id);
                setRepoUrl(p.repo_url);
              }}
            >
              <div style={styles.cardTop}>
                <FolderGit2 size={24} color="#00ccff" />
                <span style={styles.visibility}>{p.visibility}</span>
              </div>
              
              <h3 style={styles.name}>{p.name}</h3>
              <p style={styles.url}>{p.repo_url.replace('https://github.com/', '')}</p>
              
              <div style={styles.stats}>
                <div style={styles.stat} title="Total Pipeline Runs">
                  <GitCommit size={14} color="#555" />
                  <span>{p.stats?.runs || 0}</span>
                </div>
                <div style={styles.stat} title="Total Automated Fixes & Issues">
                  <AlertTriangle size={14} color={p.stats?.issues > 0 ? '#ffaa00' : '#555'} />
                  <span>{p.stats?.issues || 0}</span>
                </div>
                <div style={{ flex: 1 }} />
                <div style={styles.stat}>
                  <Calendar size={12} color="#555" />
                  <span style={{ fontSize: 10 }}>{new Date(p.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .project-card { text-decoration: none; color: inherit; display: block; transition: border-color 0.2s; }
        .project-card:hover { border-color: #00ff88 !important; }
      `}</style>
    </div>
  );
}

const styles = {
  page: { padding: 32 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  title: { fontSize: 24, fontWeight: 800, letterSpacing: 1, marginBottom: 8 },
  sub: { fontSize: 13, color: '#888', fontFamily: "'JetBrains Mono', monospace" },
  newBtn: { display: 'flex', alignItems: 'center', gap: 8, background: '#00ff88', color: '#000', padding: '10px 16px', borderRadius: 8, fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 13 },
  
  center: { display: 'flex', justifyContent: 'center', padding: 60 },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80, color: '#555', gap: 16, border: '1px dashed #1e1e2e', borderRadius: 12 },
  
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 },
  card: { background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: 12, padding: 20, cursor: 'pointer' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  visibility: { fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, color: '#888', background: '#111118', padding: '4px 8px', borderRadius: 12 },
  name: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  url: { fontSize: 11, color: '#555', fontFamily: "'JetBrains Mono', monospace", marginBottom: 24, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  
  stats: { display: 'flex', alignItems: 'center', gap: 16, borderTop: '1px solid #1e1e2e', paddingTop: 16 },
  stat: { display: 'flex', alignItems: 'center', gap: 6, color: '#aaa', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }
};
