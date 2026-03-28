import { useEffect, useState } from 'react';
import { Activity, GitMerge, FileWarning, TrendingUp, Cpu, Network, Shield, Zap } from 'lucide-react';
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
    { title: 'ACTIVE_NODES', value: stats.projects, icon: Network, color: 'var(--cyan)', label: 'NODES_CONNECTED' },
    { title: 'UPLINK_RUNS', value: stats.runs, icon: Zap, color: 'var(--green)', label: 'TOTAL_EXECUTIONS' },
    { title: 'OPEN_ANOMALIES', value: stats.issues, icon: FileWarning, color: 'var(--red)', label: 'CRITICAL_ISSUES' },
    { title: 'INTEGRITY_SCORE', value: '98.4%', icon: Shield, color: 'var(--green)', label: 'SYSTEM_STABILITY' },
  ];

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.titleWrap}>
            <h1 style={styles.title}>SYSTEM_COMMAND_CENTER</h1>
            <div style={styles.titleLines}></div>
        </div>
        <p style={styles.sub}>REAL_TIME_TELEMETRY // NODE_ORCHESTRATION_V3</p>
      </header>

      <div style={styles.grid}>
        {cards.map(c => (
          <div key={c.title} style={{ ...styles.card, borderLeft: `2px solid ${c.color}` }}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>{c.title}</span>
              <c.icon size={14} color={c.color} style={{opacity: 0.8}} />
            </div>
            <div style={styles.cardMain}>
                <div style={styles.cardValue}>{c.value}</div>
                <div style={styles.cardLabel}>{c.label}</div>
            </div>
            <div style={styles.cardGraph}>
                <div style={{...styles.graphBar, background: c.color, width: '70%', opacity: 0.2}}></div>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.dashboardBody}>
        <div style={styles.mainCol}>
            <div style={styles.heatmapCard}>
                <div style={styles.sectionHeader}>
                    <Activity size={14} color="var(--green)" />
                    <h3 style={styles.sectionTitle}>ACTIVITY_METRICS_GRID</h3>
                </div>
                <div style={styles.heatmapGrid}>
                    {loadingHeatmap ? (
                        Array.from({ length: 156 }).map((_, i) => (
                            <div key={i} style={{ ...styles.heatmapCell, background: 'rgba(255,255,255,0.02)' }}></div>
                        ))
                    ) : heatmap.length === 0 ? (
                        <div style={styles.emptyHeatmap}>
                            <span style={styles.emptyText}>GRID_DATA_OFFLINE</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {Array.from({ length: 156 }).map((_, i) => (
                                    <div key={i} style={{ ...styles.heatmapCell, background: 'rgba(255,255,255,0.01)' }}></div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        Array.from({ length: 156 }).map((_, i) => {
                            const dataIndex = heatmap.length - 156 + i;
                            const dayData = dataIndex >= 0 ? heatmap[dataIndex] : null;
                            const count = dayData ? dayData.count : 0;
                            
                            let color = 'rgba(255,255,255,0.03)';
                            let glow = 'none';
                            if (count > 5) { color = 'var(--green)'; glow = '0 0 8px var(--green)'; }
                            else if (count > 2) color = 'rgba(0, 255, 136, 0.5)';
                            else if (count > 0) color = 'rgba(0, 255, 136, 0.2)';
                            
                            return (
                                <div key={i} title={dayData?.date} style={{
                                    ...styles.heatmapCell,
                                    background: color,
                                    boxShadow: glow
                                }}></div>
                            );
                        })
                    )}
                </div>
                <div style={styles.heatmapFooter}>
                    <span style={styles.footLabel}>LOW_ACTIVITY</span>
                    <div style={styles.legend}>
                        <div style={{...styles.legCell, opacity: 0.1}}></div>
                        <div style={{...styles.legCell, opacity: 0.3}}></div>
                        <div style={{...styles.legCell, opacity: 0.6}}></div>
                        <div style={{...styles.legCell, background: 'var(--green)'}}></div>
                    </div>
                    <span style={styles.footLabel}>PEAK_UPLINK</span>
                </div>
            </div>

            <div style={styles.sysDiagnostics}>
                <div style={styles.diagHeader}>
                    <Cpu size={14} color="var(--cyan)" />
                    <span style={styles.sectionTitle}>NODE_DIAGNOSTICS</span>
                </div>
                <div style={styles.diagGrid}>
                    <div style={styles.diagItem}>
                        <span style={styles.diagLabel}>CPU_ORCHESTRATION</span>
                        <div style={styles.diagBar}><div style={{...styles.diagFill, width: '42%', background: 'var(--cyan)'}}></div></div>
                    </div>
                    <div style={styles.diagItem}>
                        <span style={styles.diagLabel}>MEM_ALLOCATION</span>
                        <div style={styles.diagBar}><div style={{...styles.diagFill, width: '68%', background: 'var(--green)'}}></div></div>
                    </div>
                    <div style={styles.diagItem}>
                        <span style={styles.diagLabel}>NET_THROUGHPUT</span>
                        <div style={styles.diagBar}><div style={{...styles.diagFill, width: '89%', background: 'var(--green)'}}></div></div>
                    </div>
                </div>
            </div>
        </div>
        
        <div style={styles.sideCol}>
            <CommandCenter />
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '40px 60px', position: 'relative' },
  header: { marginBottom: 48 },
  titleWrap: { display: 'flex', alignItems: 'center', gap: 20, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 800, letterSpacing: 3, color: 'var(--text-primary)' },
  titleLines: { flex: 1, height: 1, background: 'linear-gradient(to right, var(--border), transparent)' },
  sub: { fontSize: 10, color: 'var(--text-secondary)', fontFamily: "var(--font-mono)", letterSpacing: 2, fontWeight: 700 },
  
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 48 },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, padding: 24, position: 'relative', overflow: 'hidden' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardTitle: { fontSize: 9, letterSpacing: 2, color: 'var(--text-secondary)', fontWeight: 800, fontFamily: "var(--font-mono)" },
  cardMain: { marginBottom: 16 },
  cardValue: { fontSize: 36, fontWeight: 900, fontFamily: "var(--font-heading)", letterSpacing: -1 },
  cardLabel: { fontSize: 8, color: 'var(--text-secondary)', fontFamily: "var(--font-mono)", marginTop: 4, opacity: 0.6 },
  cardGraph: { height: 2, background: 'rgba(255,255,255,0.03)', width: '100%', borderRadius: 1 },
  graphBar: { height: '100%' },

  dashboardBody: { display: 'grid', gridTemplateColumns: '1fr 400px', gap: 32 },
  mainCol: { display: 'flex', flexDirection: 'column', gap: 32 },
  heatmapCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, padding: 32 },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 },
  sectionTitle: { fontSize: 10, letterSpacing: 2, color: 'var(--text-primary)', fontWeight: 800, fontFamily: "var(--font-mono)" },
  heatmapGrid: { display: 'flex', flexWrap: 'wrap', gap: 6, opacity: 0.9 },
  heatmapCell: { width: 14, height: 14, borderRadius: 1 },
  heatmapFooter: { marginTop: 24, display: 'flex', alignItems: 'center', gap: 16, borderTop: '1px solid var(--border)', paddingTop: 16 },
  footLabel: { fontSize: 8, color: 'var(--text-secondary)', fontFamily: "var(--font-mono)", fontWeight: 700 },
  legend: { display: 'flex', gap: 4 },
  legCell: { width: 10, height: 10, borderRadius: 1, background: 'var(--green)' },

  sysDiagnostics: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, padding: 32 },
  diagHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 },
  diagGrid: { display: 'flex', flexDirection: 'column', gap: 20 },
  diagItem: { display: 'flex', flexDirection: 'column', gap: 8 },
  diagLabel: { fontSize: 8, color: 'var(--text-secondary)', fontFamily: "var(--font-mono)", fontWeight: 700 },
  diagBar: { height: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 2, overflow: 'hidden' },
  diagFill: { height: '100%', borderRadius: 2 },

  sideCol: { display: 'flex', flexDirection: 'column' },
  emptyHeatmap: { position: 'relative', width: '100% '},
  emptyText: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 10, fontWeight: 900, color: 'var(--text-secondary)', letterSpacing: 3, background: 'var(--surface)', padding: '8px 16px', border: '1px solid var(--border)', zIndex: 1, fontFamily: "var(--font-mono)" }
};
