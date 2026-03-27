import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgentStore } from '../store/agentStore';
import { useAuth } from '../hooks/useAuth';
import { 
  GitBranch, Search, ArrowRight, Loader, 
  ExternalLink, Star, ArrowLeft, RefreshCcw, AlertCircle
} from 'lucide-react';
import { getRepos, createProject, registerUser } from '../lib/api';

export default function ConnectRepoPage() {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const setRepoUrl = useAgentStore(s => s.setRepoUrl);
  const setProjectId = useAgentStore(s => s.setProjectId);
  
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [search, setSearch] = useState('');
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const fetchRepos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getRepos();
      
      if (data && data.repos) {
        setRepos(data.repos);
      } else {
        setRepos([]);
      }
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && session?.access_token) {
      fetchRepos();
    } else if (!authLoading && !session?.access_token) {
      setLoading(false);
    }
  }, [session, authLoading]);

  const filtered = Array.isArray(repos) ? repos.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(search.toLowerCase()))
  ) : [];

  const handleContinue = async () => {
    if (!selectedRepo) return;
    setConnecting(true);
    setError(null);
    try {
      await registerUser({ email: session?.user?.email || '', profile_data: {} });
      const data = await createProject({
        repo_url: selectedRepo.html_url,
        name: selectedRepo.name,
        tags: ['imported'],
        visibility: selectedRepo.private ? 'private' : 'public'
      });
      setRepoUrl(selectedRepo.html_url);
      setProjectId(data.project.id);
      navigate('/invite');
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
            <h1 style={styles.title}>Connect Repository</h1>
            <p style={styles.sub}>Select a repository to start your automated CI/CD project.</p>
        </div>

        {/* Debug Info (Only if empty) */}
        {!loading && repos.length === 0 && !error && (
            <div style={styles.alert}>
                <AlertCircle size={16} />
                <span>No repos found. Session: {session ? 'Active' : 'Missing'}. </span>
                <button onClick={fetchRepos} style={styles.smallBtn}>Re-sync</button>
            </div>
        )}

        <div style={styles.searchBox}>
          <Search size={18} color="#666" />
          <input 
            style={styles.searchInput} 
            placeholder="Search your GitHub..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>

        <div style={styles.list}>
          {loading ? (
            <div style={styles.center}>
              <Loader size={24} className="spin" color="#00ff88" />
              <p style={{marginTop: 12, color: '#666'}}>Syncing with GitHub...</p>
            </div>
          ) : error ? (
            <div style={styles.center}>
              <p style={{color: '#ff4b4b', marginBottom: 16}}>{error}</p>
              <button style={styles.retryBtn} onClick={fetchRepos}><RefreshCcw size={14} /> Try Again</button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={styles.center}>
              <p style={{color: '#666'}}>No repositories found matching your search.</p>
            </div>
          ) : (
            filtered.map((repo) => (
              <div 
                key={repo.id} 
                style={{
                  ...styles.item,
                  borderColor: selectedRepo?.id === repo.id ? '#00ff88' : '#1e1e2e',
                  background: selectedRepo?.id === repo.id ? '#00ff8808' : '#0f0f15'
                }}
                onClick={() => setSelectedRepo(repo)}
              >
                <div style={styles.itemLeft}>
                   <GitBranch size={18} color={selectedRepo?.id === repo.id ? '#00ff88' : '#555'} />
                   <div style={styles.itemMeta}>
                      <span style={styles.itemName}>{repo.name}</span>
                      <a href={repo.html_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={styles.link}>
                        <ExternalLink size={12} />
                      </a>
                   </div>
                </div>
                {repo.stars > 0 && (
                    <div style={styles.star}>
                        <Star size={12} fill="#ffcc00" color="#ffcc00" />
                        <span>{repo.stars}</span>
                    </div>
                )}
              </div>
            ))
          )}
        </div>

        <div style={styles.footer}>
          <button style={styles.back} onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> BACK
          </button>
          <button 
            style={{
                ...styles.btn,
                opacity: selectedRepo ? 1 : 0.5,
                cursor: selectedRepo ? 'pointer' : 'not-allowed'
            }}
            disabled={!selectedRepo || connecting}
            onClick={handleContinue}
          >
            {connecting ? <Loader size={18} className="spin" /> : "CONTINUE"} <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        div::-webkit-scrollbar { width: 6px; }
        div::-webkit-scrollbar-thumb { background: #1e1e2e; border-radius: 10px; }
      `}</style>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#050508', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" },
  container: { width: 500, padding: '40px 20px' },
  header: { marginBottom: 32 },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 8 },
  sub: { color: '#666', fontSize: 13 },
  
  alert: { display: 'flex', alignItems: 'center', gap: 10, background: '#ffcc0011', border: '1px solid #ffcc0033', padding: '10px 14px', borderRadius: 8, fontSize: 12, color: '#ffcc00', marginBottom: 20 },
  smallBtn: { background: '#ffcc00', color: '#000', border: 'none', padding: '2px 8px', borderRadius: 4, fontWeight: 700, cursor: 'pointer', marginLeft: 'auto' },

  searchBox: { display: 'flex', alignItems: 'center', gap: 12, background: '#0f0f15', border: '1px solid #1e1e2e', borderRadius: 12, padding: '10px 16px', marginBottom: 20 },
  searchInput: { flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: 14, outline: 'none' },

  list: { height: 350, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, background: '#00000044', borderRadius: 12, border: '1px solid #1e1e2e', padding: 8 },
  center: { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20 },
  
  item: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', border: '1px solid', borderRadius: 10, cursor: 'pointer', transition: '0.2s' },
  itemLeft: { display: 'flex', alignItems: 'center', gap: 15 },
  itemMeta: { display: 'flex', alignItems: 'center', gap: 8 },
  itemName: { fontSize: 14, fontWeight: 600 },
  link: { color: '#444', transition: '0.2s', display: 'flex' },
  
  star: { display: 'flex', alignItems: 'center', gap: 4, color: '#ffcc00', fontSize: 11, fontWeight: 700 },
  
  retryBtn: { background: '#1e1e2e', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 },
  
  footer: { marginTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  back: { background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 },
  btn: { background: '#fff', color: '#000', border: 'none', padding: '12px 24px', borderRadius: 10, fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 },
};
