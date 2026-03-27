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

        // Always add to thought stream
        appendThought(data);

        // Handle specific event types
        switch (data.type) {
          case 'FIX_APPLIED':
            // Try to parse fix data from message
            try {
              const fixData = JSON.parse(data.message);
              appendFix(fixData);
            } catch {
              appendFix({
                file: data.agent,
                bug_type: 'FIX',
                explanation: data.message,
                status: 'applied',
              });
            }
            break;

          case 'RUN_COMPLETED':
            // Try to extract result data
            try {
              const result = JSON.parse(data.message);
              if (result.score) setScore(result.score);
              if (result.health_score) setHealthScore(result.health_score);
              if (result.causal_graph) setCausalGraph(result.causal_graph);
              if (result.total_failures !== undefined) setTotals(result.total_failures, result.total_fixes);
            } catch {
              // Not JSON — just a status message
            }
            setStatus('passed');
            setEndTime(new Date().toISOString());
            es.close();
            break;

          case 'RUN_FAILED':
          case 'error':
            setStatus('failed');
            setEndTime(new Date().toISOString());
            es.close();
            break;

          default:
            break;
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
