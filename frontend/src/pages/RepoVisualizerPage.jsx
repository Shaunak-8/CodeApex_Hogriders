import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAgentStore } from '../store/agentStore';
import ReactFlow, { Background, Controls, MarkerType } from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import { Network, ArrowLeft, Loader, RefreshCw, AlertTriangle } from 'lucide-react';

import { getRepoGraph } from '../lib/api';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes, edges, direction = 'LR') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 170, height: 50 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? 'left' : 'top';
    node.sourcePosition = isHorizontal ? 'right' : 'bottom';
    node.position = {
      x: nodeWithPosition.x - 170 / 2,
      y: nodeWithPosition.y - 50 / 2,
    };
    return node;
  });
};

export default function RepoVisualizerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const repoUrl = useAgentStore(s => s.repoUrl);

  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);

  const fetchGraph = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const data = await getRepoGraph(id);
      
      const rawNodes = (data.nodes || []).map(n => ({
        id: n.id,
        data: { label: n.id, risk_score: n.risk_score },
      }));
      
      const rawEdges = (data.edges || []).map((e, idx) => ({
        id: `e-${idx}`,
        source: e.source,
        target: e.target,
        animated: true,
        style: { stroke: '#555', strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#555' },
      }));

      const layouted = getLayoutedElements(rawNodes, rawEdges);
      setGraphData({ nodes: layouted, edges: rawEdges });
    } catch (e) {
      console.error("Failed to fetch graph:", e);
    } finally {
      setLoading(false);
    }
  }, [id, session]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  const nodes = useMemo(() => {
    return graphData.nodes.map((node) => {
      let bg = '#00ff88'; // Green
      let accent = '#00ff88';
      const risk = node.data.risk_score || 0;

      if (risk >= 0.7) {
        bg = '#ff3b3b'; accent = '#ff3b3b';
      } else if (risk >= 0.4) {
        bg = '#ffaa00'; accent = '#ffaa00';
      }

      return {
        ...node,
        data: {
          label: (
            <div style={{ ...styles.nodeContainer, borderLeft: `4px solid ${accent}` }}>
               <div style={styles.nodeIcon}>
                  {risk >= 0.6 ? <AlertTriangle size={12} color={accent}/> : <Network size={12} color={accent}/>}
               </div>
               <div style={styles.nodeText}>
                  <div style={styles.nodeName}>{node.id.split('/').pop()}</div>
                  <div style={styles.nodePath}>{node.id.split('/').slice(0,-1).join('/') || './'}</div>
               </div>
               <div style={{...styles.riskBadge, background: `${accent}22`, color: accent}}>
                  {Math.round(risk * 100)}%
               </div>
            </div>
          )
        },
        style: styles.nodeStyle,
      };
    });
  }, [graphData.nodes]);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button style={styles.iconBtn} onClick={() => navigate(`/app/project/${id}`)}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={styles.title}>Architecture Visualizer</h1>
            <p style={styles.sub}>{repoUrl?.replace('https://github.com/', '') || 'Project ' + id} • AST Dependency Analysis</p>
          </div>
        </div>
        <button style={styles.refreshBtn} onClick={fetchGraph} disabled={loading}>
            <RefreshCw size={14} className={loading ? "spin" : ""} /> {loading ? "Analyzing..." : "Refresh Graph"}
        </button>
      </header>

      <div style={styles.graphContainer}>
        {loading && graphData.nodes.length === 0 ? (
            <div style={styles.loadingBox}>
              <div className="pulse-ring"></div>
              <Loader size={32} className="spin" color="#00ff88" /> 
              <span>Decompressing Project Structure...</span>
            </div>
        ) : (
            <ReactFlow 
              nodes={nodes} 
              edges={graphData.edges} 
              fitView
              minZoom={0.2}
              maxZoom={1.5}
            >
               <Background color="#111" gap={20} variant="dots" />
               <Controls style={{ background: '#111', fill: '#00ff88', border: '1px solid #333' }}/>
            </ReactFlow>
        )}
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .pulse-ring {
          position: absolute;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #00ff8811;
          animation: pulse 2s infinite;
        }
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(2); opacity: 0; } }
      `}</style>
    </div>
  );
}

const styles = {
  page: { padding: '24px 40px', display: 'flex', flexDirection: 'column', height: '100vh', background: '#050505', color: '#fff' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexShrink: 0 },
  iconBtn: { background: '#111', border: '1px solid #222', color: '#888', padding: 10, borderRadius: 12, cursor: 'pointer', transition: '0.2s', ':hover': { color: '#fff', borderColor: '#444' } },
  title: { fontSize: 28, fontWeight: 900, letterSpacing: -0.5, marginBottom: 2, background: 'linear-gradient(to right, #fff, #888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  sub: { fontSize: 13, color: '#555', fontFamily: "'JetBrains Mono', monospace" },
  refreshBtn: { padding: '10px 20px', borderRadius: 12, background: '#00ff88', color: '#000', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, transition: '0.2s' },
  
  graphContainer: { flex: 1, background: '#0a0a0f', borderRadius: 24, border: '1px solid #1a1a1a', overflow: 'hidden', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' },
  loadingBox: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, color: '#00ff88', fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 600 },

  nodeStyle: {
    background: 'rgba(20, 20, 25, 0.8)',
    backdropFilter: 'blur(10px)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 0,
    width: 200,
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
  nodeContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 14px',
    borderRadius: 12,
    width: '100%',
    overflow: 'hidden',
  },
  nodeIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: 'rgba(255,255,255,0.03)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeText: {
    flex: 1,
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  nodeName: {
    fontSize: 13,
    fontWeight: 700,
    color: '#eee',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  nodePath: {
    fontSize: 10,
    color: '#666',
    fontFamily: "'JetBrains Mono', monospace",
  },
  riskBadge: {
    fontSize: 10,
    fontWeight: 800,
    padding: '2px 6px',
    borderRadius: 6,
  }
};

