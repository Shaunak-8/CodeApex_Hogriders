import { useEffect, useRef } from 'react';
import { useAgentStore } from '../store/agentStore';

export const useAgentSSE = (runId) => {
  const ref = useRef(null);
  const appendThought = useAgentStore((s) => s.appendThought);
  const appendFix = useAgentStore((s) => s.appendFix);
  const setScore = useAgentStore((s) => s.setScore);
  const setHealthScore = useAgentStore((s) => s.setHealthScore);
  const setCausalGraph = useAgentStore((s) => s.setCausalGraph);
  const setStatus = useAgentStore((s) => s.setStatus);
  const setEndTime = useAgentStore((s) => s.setEndTime);
  const setTotals = useAgentStore((s) => s.setTotals);

  useEffect(() => {
    if (!runId) return;

    const baseUrl = import.meta.env.VITE_API_URL || '';
    const es = new EventSource(`${baseUrl}/stream/${runId}`);
    ref.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'heartbeat') return;

        if (data.type === 'thought') {
          appendThought(data);
        } else if (data.type === 'fix') {
          appendThought(data);
          appendFix(data);
        } else if (data.type === 'result') {
          const result = JSON.parse(data.message);
          setScore(result.score);
          setHealthScore(result.health_score);
          setCausalGraph(result.causal_graph);
          setTotals(result.total_failures, result.total_fixes);
          setStatus('passed');
          setEndTime(new Date().toISOString());
          es.close();
        } else if (data.type === 'error') {
          appendThought(data);
          setStatus('failed');
          setEndTime(new Date().toISOString());
          es.close();
        }
      } catch (e) {
        console.error('SSE parse error:', e);
      }
    };

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, [runId]);
};
