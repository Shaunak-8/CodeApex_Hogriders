import { useAgentStore } from '../store/agentStore';
import { runAgent } from '../lib/api';

export const useAgentRun = () => {
    const store = useAgentStore();

    const startRun = async () => {
        if (!store.repoUrl) return;

        store.reset();
        store.setStatus('running');
        store.setStartTime(new Date().toISOString());

        try {
            const result = await runAgent({ 
                repo_url: store.repoUrl, 
                team_name: store.teamName, 
                leader_name: store.leaderName 
            });
            store.setRunId(result.run_id);
        } catch (error) {
            console.error('Failed to start run', error);
            store.setStatus('failed');
        }
    };

    return { startRun };
};
