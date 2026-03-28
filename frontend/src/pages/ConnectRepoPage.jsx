import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgentStore } from '../store/agentStore';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { GitBranch, Search, ArrowRight, Check, Loader, Tag, X } from 'lucide-react';
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
      // Ensure the user row exists in our DB before creating a project
      await registerUser({ email: session.user?.email || '', profile_data: {} });

      const data = await createProject({
        repo_url: selectedRepo.html_url,
        name: selectedRepo.name,
        tags: ['imported'],
        visibility: selectedRepo.private ? 'private' : 'public'
      });

      setRepoUrl(repoUrl);
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
      {/* Grid Overlay */}
      <div style={styles.gridOverlay}></div>

      <div style={styles.container}>
        <div style={styles.progress}>
          <div style={styles.stepDone}></div>
          <div style={styles.stepDone}></div>
          <div style={styles.stepActive}></div>
          <div style={styles.stepTodo}></div>
        </div>

        <p style={styles.eyebrow}>STEP 3 OF 4</p>
        <h1 style={styles.title}>Connect Your Repository</h1>
        <p style={styles.sub}>Paste a GitHub URL or select from your repos.</p>

        {/* URL Input */}
        <div style={styles.urlBox}>
          <GitBranch size={16} color="#00ff88" />
          <input
            style={styles.urlInput}
            placeholder="https://github.com/username/repo"
            value={url}
            maxLength={500}
            onChange={e => { setUrl(e.target.value); setConnected(false); }}
          />
          <button
            style={{ ...styles.connectBtn, ...(connected ? styles.connectedBtn : {}) }}
            onClick={() => handleConnect(url)}
            disabled={!url || connecting}
          >
            {connecting ? <Loader size={14} className="spin" /> : connected ? <><Check size={14} /> Connected</> : 'Connect'}
          </button>
        </div>

        {/* Tag Input */}
        <div style={styles.tagSection}>
          <div style={styles.urlBox}>
            <Tag size={14} color="#00ccff" />
            <input
              style={styles.urlInput}
              placeholder="Add a tag and press Enter..."
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && tagInput.trim()) {
                  e.preventDefault();
                  if (!tags.includes(tagInput.trim())) setTags(prev => [...prev, tagInput.trim()]);
                  setTagInput('');
                }
              }}
            />
            <button
              style={styles.connectBtn}
              onClick={() => {
                if (tagInput.trim() && !tags.includes(tagInput.trim())) {
                  setTags(prev => [...prev, tagInput.trim()]);
                  setTagInput('');
                }
              }}
            >+</button>
          </div>
          {tags.length > 0 && (
            <div style={styles.tagList}>
              {tags.map((t, i) => (
                <span key={i} style={styles.tagChip}>
                  {t} <X size={10} style={{ cursor: 'pointer' }} onClick={() => setTags(prev => prev.filter((_, j) => j !== i))} />
                </span>
              ))}
            </div>
          )}
        </div>

        {error && <p style={styles.error}>{error}</p>}

        {/* Repo List */}
        <div style={styles.repoSection}>
          <div style={styles.searchBox}>
            <Search size={14} color="#555" />
            <input style={styles.searchInput} placeholder="Search your GitHub..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={styles.repoList}>
            {loading ? <p style={styles.loadingInfo}><Loader size={16} className="spin" /> Syncing with GitHub...</p> :
              filtered.length === 0 ? <p style={styles.loadingInfo}>No repositories found.</p> :
                filtered.map((repo, i) => (
                  <div key={i} style={styles.repoItem} onClick={() => { setUrl(repo.html_url); handleConnect(repo.html_url, repo.name); }}>
                    <div>
                      <span style={styles.repoName}>{repo.name}</span>
                      {repo.language && <span style={styles.repoLang}>{repo.language}</span>}
                    </div>
                    <span style={styles.repoTime}>{new Date(repo.updated_at).toLocaleDateString()}</span>
                  </div>
                ))}
          </div>
        </div>

        <button
          style={{ ...styles.nextBtn, opacity: connected ? 1 : 0.3 }}
          disabled={!connected}
          onClick={() => navigate('/invite')}
        >
          CONTINUE <ArrowRight size={14} />
        </button>
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
  page: { minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne', sans-serif" },
  container: { width: 560, padding: 48 },
  progress: { display: 'flex', gap: 6, marginBottom: 32 },
  stepDone: { flex: 1, height: 3, borderRadius: 2, background: '#00ff88' },
  stepActive: { flex: 1, height: 3, borderRadius: 2, background: 'linear-gradient(to right, #00ff88, #1e1e2e)' },
  stepTodo: { flex: 1, height: 3, borderRadius: 2, background: '#1e1e2e' },
  eyebrow: { fontSize: 10, letterSpacing: 3, color: '#00ff88', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 800, letterSpacing: 1, marginBottom: 8 },
  sub: { color: '#555', fontSize: 12, marginBottom: 32, fontFamily: "'JetBrains Mono', monospace" },

  urlBox: { display: 'flex', alignItems: 'center', gap: 12, background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, padding: '8px 12px', marginBottom: 24 },
  urlInput: { flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: 13, outline: 'none' },
  connectBtn: { padding: '8px 20px', background: '#1e1e2e', border: 'none', color: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 600 },
  connectedBtn: { background: '#00ff8822', color: '#00ff88', display: 'flex', alignItems: 'center', gap: 6 },
  error: { color: '#ff3b3b', fontSize: 11, marginBottom: 16, fontFamily: "'JetBrains Mono', monospace" },

  repoSection: { marginBottom: 24 },
  searchBox: { display: 'flex', alignItems: 'center', gap: 8, background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: 10, padding: '8px 12px', marginBottom: 12 },
  searchInput: { flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: 12, outline: 'none' },
  repoList: { display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto' },
  repoItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#111118', borderRadius: 10, cursor: 'pointer', border: '1px solid transparent', transition: '0.2s' },
  repoName: { color: '#fff', fontSize: 13, fontWeight: 600 },
  repoLang: { fontSize: 10, color: '#00ccff', marginLeft: 10, background: '#00ccff11', padding: '2px 6px', borderRadius: 4 },
  repoTime: { color: '#555', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" },
  loadingInfo: { color: '#555', fontSize: 11, padding: 16, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },

  nextBtn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', background: 'linear-gradient(135deg, #00ff88, #00cc6a)', color: '#000', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: 13 },

  tagSection: { marginBottom: 16 },
  tagList: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: -12, marginBottom: 16 },
  tagChip: { display: 'inline-flex', alignItems: 'center', gap: 4, background: '#00ccff18', color: '#00ccff', border: '1px solid #00ccff33', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 },
};
