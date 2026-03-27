import { useAgentStore } from '../store/agentStore';
import { runAgent } from '../lib/api';
import { useCallback } from 'react';

export const useAgentRun = () => {
    const repoUrl = useAgentStore((s) => s.repoUrl);
    const teamName = useAgentStore((s) => s.teamName);
    const leaderName = useAgentStore((s) => s.leaderName);
    const reset = useAgentStore((s) => s.reset);
    const setStatus = useAgentStore((s) => s.setStatus);
    const setStartTime = useAgentStore((s) => s.setStartTime);
    const setRunId = useAgentStore((s) => s.setRunId);

    const startRun = useCallback(async () => {
        if (!repoUrl) return;

        reset();
        setStatus('running');
        setStartTime(new Date().toISOString());

        try {
            const result = await runAgent({ 
                repo_url: repoUrl, 
                team_name: teamName, 
                leader_name: leaderName 
            });
            setRunId(result.run_id);
        } catch (error) {
            console.error('Failed to start run', error);
            setStatus('failed');
        }
    }, [repoUrl, teamName, leaderName, reset, setStatus, setStartTime, setRunId]);

    return { startRun };
};
