import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

const nodeTypes = {}; // Define custom node types if needed

const CausalityGraph = ({ graph }) => {
  const nodes = useMemo(() => {
    return (graph.nodes || []).map((node, i) => ({
      id: node.id,
      data: { label: node.id },
      position: { x: i * 200, y: i * 100 },
      style: {
        background: node.status === 'fixed' ? '#00ff8822' : '#ff3b3b22',
        color: '#fff',
        border: `1px solid ${node.status === 'fixed' ? '#00ff88' : '#ff3b3b'}`,
        borderRadius: '8px',
        fontSize: '10px',
        fontFamily: "'JetBrains Mono', monospace",
        width: 150,
      },
    }));
  }, [graph.nodes]);

  const edges = useMemo(() => {
    return (graph.edges || []).map((edge, i) => ({
      id: `e-${i}`,
      source: edge.source,
      target: edge.target,
      animated: true,
      style: { stroke: '#555' },
    }));
  }, [graph.edges]);

  return (
    <div style={{ height: 300, background: '#0a0a0f', borderRadius: 12, border: '1px solid #1e1e2e' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
      >
        <Background color="#1e1e2e" gap={20} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default CausalityGraph;
