import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAgentStore } from '../store/agentStore';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import { Network, ArrowLeft, Loader } from 'lucide-react';

export default function RepoVisualizerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const repoUrl = useAgentStore(s => s.repoUrl);

  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGraph() {
      if (!session?.access_token) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/projects/${id}/graph`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        setGraphData({ nodes: data.nodes || [], edges: data.edges || [] });
      } catch (e) {
        console.error("Failed to fetch graph:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchGraph();
  }, [id, session]);

  // Convert raw API graph to ReactFlow nodes
  const nodes = useMemo(() => {
    return graphData.nodes.map((node, i) => {
      // Heatmap Color Logic
      let bg = '#00ff88'; // Green (Low Risk)
      let border = '#00cc6a';
      if (node.risk_score >= 0.7) {
        bg = '#ff3b3b'; // Red (High Risk)
        border = '#cc0000';
      } else if (node.risk_score >= 0.4) {
        bg = '#ffaa00'; // Yellow (Medium Risk)
        border = '#cc8800';
      }

      return {
        id: node.id,
        data: { 
          label: (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
               <span style={{ fontWeight: 'bold' }}>{node.id.split('/').pop()}</span>
               <span style={{ fontSize: 9, opacity: 0.8 }}>Risk: {node.risk_score}</span>
            </div>
          )
        },
        // Auto layout simulation (since we don't have dagre installed, we use naive positioning)
        position: { x: Math.random() * 600, y: Math.random() * 400 },
        style: {
          background: `${bg}22`,
          color: '#fff',
          border: `1px solid ${border}`,
          borderRadius: 8,
          fontSize: 10,
          fontFamily: "'JetBrains Mono', monospace",
          width: 140,
        },
      };
    });
  }, [graphData.nodes]);

  const edges = useMemo(() => {
    return graphData.edges.map((edge, i) => ({
      id: `e-${i}`,
      source: edge.source,
      target: edge.target,
      animated: true,
      style: { stroke: '#555' },
    }));
  }, [graphData.edges]);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}><Network size={24} color="#00ff88" style={{marginRight: 10}}/> Repo Visualizer</h1>
          <p style={styles.sub}>{repoUrl?.replace('https://github.com/', '') || 'Project ' + id} - AST Dependency Heatmap</p>
        </div>
        <button style={styles.backBtn} onClick={() => navigate(`/app/project/${id}`)}>
            <ArrowLeft size={14} /> Back to Dashboard
        </button>
      </header>

      <div style={styles.graphContainer}>
        {loading ? (
            <div style={styles.loadingBox}><Loader size={32} className="spin" color="#00ff88" /> Analyzing Codebase Architecture...</div>
        ) : (
            <ReactFlow nodes={nodes} edges={edges} fitView>
               <Background color="#1e1e2e" gap={20} />
               <Controls style={{ background: '#111118', fill: '#00ff88', border: 'none' }}/>
            </ReactFlow>
        )}
      </div>

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
  backBtn: { padding: '8px 16px', borderRadius: 8, border: '1px solid #1e1e2e', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 },
  
  graphContainer: { flex: 1, background: '#0a0a0f', borderRadius: 16, border: '1px solid #1e1e2e', overflow: 'hidden', position: 'relative' },
  loadingBox: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: '#555', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }
};
