import { useEffect, useState } from 'react';
import { Activity, GitMerge, FileWarning, TrendingUp } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getProjects, getHeatmapData } from '../lib/api';
import CommandCenter from '../components/CommandCenter';

export default function GlobalDashboardPage() {
  const { session } = useAuth();
  const [stats, setStats] = useState({ projects: 0, runs: 0, issues: 0 });
  const [heatmap, setHeatmap] = useState([]);
  const [loadingHeatmap, setLoadingHeatmap] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!session?.access_token) return;
      try {
        const data = await getProjects();
        
        let totalRuns = 0;
        let totalIssues = 0;
        (data.projects || []).forEach(p => {
            totalRuns += (p.stats?.runs || 0);
            totalIssues += (p.stats?.issues || 0);
        });

        setStats({
            projects: data.projects?.length || 0,
            runs: totalRuns,
            issues: totalIssues
        });
      } catch (e) {
        console.error(e);
      }
    }
    async function fetchHeatmap() {
        try {
            const data = await getHeatmapData();
            setHeatmap(data.heatmap || []);
        } catch (e) {
            console.error("Failed to fetch heatmap:", e);
        } finally {
            setLoadingHeatmap(false);
        }
    }
    fetchStats();
    fetchHeatmap();
  }, [session]);

  const cards = [
    { title: 'ACTIVE PROJECTS', value: stats.projects, icon: Activity, color: '#00ccff' },
    { title: 'TOTAL PIPELINE RUNS', value: stats.runs, icon: GitMerge, color: '#00ff88' },
    { title: 'OPEN ISSUES', value: stats.issues, icon: FileWarning, color: '#ff3b3b' },
    { title: 'PLATFORM IMPACT SCORE', value: 'A+', icon: TrendingUp, color: '#ffaa00' },
  ];

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>Global Overview</h1>
        <p style={styles.sub}>High-level analytics across all your connected repositories.</p>
      </header>

      <div style={styles.grid}>
        {cards.map(c => (
          <div key={c.title} style={{ ...styles.card, borderTop: `2px solid ${c.color}` }}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>{c.title}</span>
              <c.icon size={14} color={c.color} />
            </div>
            <div style={styles.cardValue}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={styles.dashboardBody}>
        <div style={styles.heatmapCard}>
          <h3 style={styles.chartTitle}>CONTRIBUTION HEATMAP</h3>
          <div style={styles.heatmapGrid}>
              {loadingHeatmap ? (
                  Array.from({ length: 156 }).map((_, i) => (
                      <div key={i} style={{ ...styles.heatmapCell, background: '#1a1a24' }}></div>
                  ))
              ) : heatmap.length === 0 ? (
                  <div style={styles.emptyHeatmap}>
                      <span style={styles.emptyText}>DATA UNAVAILABLE</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {Array.from({ length: 156 }).map((_, i) => (
                              <div key={i} style={{ ...styles.heatmapCell, background: '#111118' }}></div>
                          ))}
                      </div>
                  </div>
              ) : (
                  Array.from({ length: 156 }).map((_, i) => {
                      // Simple mapping: use the data we have, starting from the end (most recent)
                      // heatmap returns [ {date, count}, ... ] sorted by date ASC
                      const dataIndex = heatmap.length - 156 + i;
                      const dayData = dataIndex >= 0 ? heatmap[dataIndex] : null;
                      const count = dayData ? dayData.count : 0;
                      
                      let color = '#111118';
                      if (count > 5) color = '#00ff88';
                      else if (count > 2) color = '#00cc77';
                      else if (count > 0) color = '#007744';
                      
                      return (
                          <div key={i} title={dayData?.date} style={{
                              ...styles.heatmapCell,
                              background: color
                          }}></div>
                      );
                  })
              )}
          </div>
        </div>
        <CommandCenter />
      </div>
    </div>
  );
}

const styles = {
  page: { padding: 32 },
  header: { marginBottom: 32 },
  title: { fontSize: 24, fontWeight: 800, letterSpacing: 1, marginBottom: 8 },
  sub: { fontSize: 13, color: '#888', fontFamily: "'JetBrains Mono', monospace" },
  
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 },
  card: { background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: 12, padding: 20 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 10, letterSpacing: 1, color: '#555', fontWeight: 700 },
  cardValue: { fontSize: 32, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace" },

  dashboardBody: { display: 'grid', gridTemplateColumns: '1fr 400px', gap: 20 },
  heatmapCard: { background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: 12, padding: 24 },
  chartTitle: { fontSize: 11, letterSpacing: 2, color: '#888', marginBottom: 20 },
  heatmapGrid: { display: 'flex', flexWrap: 'wrap', gap: 4, opacity: 0.8, minHeight: 44 },
  heatmapCell: { width: 12, height: 12, borderRadius: 2 },
  emptyHeatmap: { position: 'relative', width: '100% '},
  emptyText: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 10, fontWeight: 800, color: '#444', letterSpacing: 2, background: 'rgba(10,10,15,0.8)', padding: '4px 8px', borderRadius: 4, zIndex: 1 }
};
