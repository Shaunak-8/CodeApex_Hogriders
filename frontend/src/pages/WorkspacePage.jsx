import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAgentStore } from '../store/agentStore';
import { Bot, ArrowRight, Loader, Plus, LayoutGrid, CheckCircle2, Circle } from 'lucide-react';
import { getProjectTasks, workspaceChat, updateTask, getProjects } from '../lib/api';

export default function WorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const repoUrl = useAgentStore(s => s.repoUrl);
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatting, setChatting] = useState(false);
  const [aiSummary, setAiSummary] = useState('');

  const fetchTasks = async () => {
    if (!session?.access_token) return;
    try {
      const data = await getProjectTasks(id);
      setTasks(data.tasks || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Sync project details on load or ID change
  useEffect(() => {
    async function syncProject() {
      if (!id || !session?.access_token) return;
      
      const state = useAgentStore.getState();
      
      // If project changed, do a full reset
      if (state.projectId !== id) {
        state.reset();
        state.setProjectId(id);
      }
      
      // Fetch repoUrl if missing
      if (!state.repoUrl || state.projectId !== id) {
        try {
          const data = await getProjects();
          const p = data.projects?.find(proj => proj.id === id);
          if (p) state.setRepoUrl(p.repo_url);
        } catch (e) {
          console.error("Failed to sync project:", e);
        }
      }
      fetchTasks();
    }
    syncProject();
  }, [id, session]);
/* Removed stale deps: projectId, setProjectId, reset */

  const sendChat = async () => {
    if (!chatPrompt.trim() || chatting) return;

    setChatting(true);
    setAiSummary('');
    try {
      const data = await workspaceChat(id, chatPrompt);
      if (data.summary) {
          setAiSummary(data.summary);
          fetchTasks();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChatting(false);
      setChatPrompt('');
    }
  };

  const handleChatParams = (e) => {
    if (e.key === 'Enter') {
      sendChat();
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      await updateTask(taskId, newStatus);
    } catch (e) {
      console.error(e);
      fetchTasks();
    }
  };

  const todos = tasks.filter(t => t.status === 'todo');
  const done = tasks.filter(t => t.status === 'done');

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>AI Workspace</h1>
          <p style={styles.sub}>{repoUrl?.replace('https://github.com/', '') || 'Project ' + id}</p>
        </div>
        <button style={styles.backBtn} onClick={() => navigate(`/app/project/${id}`)}>
            Back to Dashboard
        </button>
      </header>

      <div style={styles.layout}>
        {/* Kanban Board */}
        <div style={styles.board}>
          <div style={styles.column}>
            <h3 style={styles.colTitle}><Circle size={14} color="#00ccff" /> TO DO ({todos.length})</h3>
            <div style={styles.taskContainer}>
                {todos.map(t => (
                    <button 
                      key={t.id} 
                      type="button"
                      style={styles.taskCard} 
                      className="task-card"
                      onClick={() => updateTaskStatus(t.id, 'done')}
                      aria-label={`Mark task as done: ${t.description}`}
                    >
                        <span style={styles.taskText}>{t.description}</span>
                    </button>
                ))}
            </div>
          </div>
          <div style={styles.column}>
            <h3 style={styles.colTitle}><CheckCircle2 size={14} color="#00ff88" /> DONE ({done.length})</h3>
            <div style={styles.taskContainer}>
                {done.map(t => (
                    <button 
                      key={t.id} 
                      type="button"
                      style={{...styles.taskCard, opacity: 0.6}} 
                      className="task-card"
                      onClick={() => updateTaskStatus(t.id, 'todo')}
                      aria-label={`Mark task as to-do: ${t.description}`}
                    >
                        <span style={{...styles.taskText, textDecoration: 'line-through'}}>{t.description}</span>
                    </button>
                ))}
            </div>
          </div>
        </div>

        {/* AI Sidebar */}
        <div style={styles.aiPanel}>
          <div style={styles.aiHeader}>
            <Bot size={16} color="#00ff88" />
            <h3 style={styles.aiTitle}>AI Product Manager</h3>
          </div>
          
          <div style={styles.aiChatArea}>
            {aiSummary ? (
                <div style={styles.aiMessage}>
                    <strong>Plan Generated:</strong><br/>
                    {aiSummary}
                </div>
            ) : (
                <div style={styles.aiHint}>
                    Tell me what you want to build or fix in this repository. I will analyze the context and generate a technical roadmap.
                </div>
            )}
            {chatting && <div style={styles.loadingBox}><Loader size={16} className="spin" color="#00ff88" /> Generating roadmap...</div>}
          </div>

          <div style={styles.chatInputBox}>
            <input 
              style={styles.chatInput} 
              placeholder="e.g. Add a Stripe payment integration..."
              value={chatPrompt}
              onChange={e => setChatPrompt(e.target.value)}
              onKeyDown={handleChatParams}
              disabled={chatting}
            />
            <button 
              style={styles.sendBtn} 
              disabled={!chatPrompt.trim() || chatting}
              onClick={sendChat}
            >
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .task-card { text-align: left; display: block; width: 100%; transition: 0.2s; }
        .task-card:hover { border-color: #00ff88 !important; }
      `}</style>
    </div>
  );
}

const styles = {
  page: { padding: '32px', display: 'flex', flexDirection: 'column', height: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexShrink: 0 },
  title: { fontSize: 24, fontWeight: 800, letterSpacing: 1, marginBottom: 8 },
  sub: { fontSize: 13, color: '#888', fontFamily: "'JetBrains Mono', monospace" },
  backBtn: { padding: '8px 16px', borderRadius: 8, border: '1px solid #1e1e2e', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 12 },

  layout: { display: 'flex', gap: 24, flex: 1, overflow: 'hidden' },
  
  board: { flex: 2, display: 'flex', gap: 20, overflowX: 'auto' },
  column: { flex: 1, minWidth: 300, background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: 12, display: 'flex', flexDirection: 'column' },
  colTitle: { padding: 16, borderBottom: '1px solid #1e1e2e', fontSize: 11, letterSpacing: 1, color: '#aaa', display: 'flex', alignItems: 'center', gap: 8, background: '#111118', borderRadius: '12px 12px 0 0' },
  taskContainer: { padding: 16, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' },
  taskCard: { background: '#111118', border: '1px solid #1e1e2e', padding: 14, borderRadius: 8, cursor: 'pointer' },
  taskText: { fontSize: 13, color: '#fff', lineHeight: 1.5, fontFamily: "'JetBrains Mono', monospace" },

  aiPanel: { width: 400, background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, display: 'flex', flexDirection: 'column' },
  aiHeader: { padding: 16, borderBottom: '1px solid #1e1e2e', display: 'flex', alignItems: 'center', gap: 10 },
  aiTitle: { fontSize: 13, fontWeight: 700, letterSpacing: 1 },
  aiChatArea: { flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 },
  aiMessage: { background: '#00ff8811', border: '1px solid #00ff8833', padding: 14, borderRadius: 10, fontSize: 13, color: '#00ff88', lineHeight: 1.6 },
  aiHint: { color: '#555', fontSize: 12, textAlign: 'center', marginTop: 40, padding: 20, fontStyle: 'italic' },
  loadingBox: { display: 'flex', alignItems: 'center', gap: 8, color: '#00ff88', fontSize: 12 },
  
  chatInputBox: { padding: 16, borderTop: '1px solid #1e1e2e', display: 'flex', gap: 10 },
  chatInput: { flex: 1, background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: 8, padding: '12px 16px', color: '#fff', fontSize: 13, outline: 'none' },
  sendBtn: { background: '#00ff88', border: 'none', color: '#000', borderRadius: 8, width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }
};
