import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart2 } from 'lucide-react';

export default function ScoreBreakdown({ score }) {
  const data = [
    { name: 'Base', value: score?.base || 100, color: '#00ff88' },
    { name: 'Bonus', value: score?.bonus || score?.speed_bonus || 0, color: '#00ccff' },
    { name: 'Penalty', value: -(score?.penalty || score?.efficiency_penalty || 0), color: '#ff3b3b' },
    { name: 'Final', value: score?.final || score?.total || 0, color: '#a855f7' },
  ];

  return (
    <div style={styles.card}>
      <h3 style={styles.title}><BarChart2 size={14} color="#a855f7" /> SCORE BREAKDOWN</h3>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a25" />
          <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} fontFamily="var(--font-code)" />
          <YAxis stroke="var(--text-secondary)" fontSize={11} fontFamily="var(--font-code)" />
          <Tooltip contentStyle={{ background: '#111118', border: '1px solid #1e1e2e', fontSize: 13 }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const styles = {
  card: { background: '#111118', border: '1px solid #1e1e2e', borderRadius: 16, padding: 20 },
  title: { fontSize: 13, color: 'var(--text-secondary) !important', letterSpacing: 2, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontFamily: "var(--font-mono) !important", fontWeight: 800 },
};
