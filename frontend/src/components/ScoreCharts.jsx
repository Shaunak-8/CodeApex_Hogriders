import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';

const ScoreCharts = ({ score, healthScore }) => {
  const barData = [
    { name: 'Base', value: score.base, color: '#00ff88' },
    { name: 'Bonus', value: score.speed_bonus || score.bonus || 0, color: '#00ccff' },
    { name: 'Penalty', value: -(score.efficiency_penalty || score.penalty || 0), color: '#ff3b3b' },
  ];

  const pieData = [
    { name: 'Health Before', value: healthScore.before, fill: '#ff3b3b33' },
    { name: 'Improvement', value: healthScore.after - healthScore.before, fill: '#00ff88' },
    { name: 'Remaining', value: 100 - healthScore.after, fill: '#1e1e2e' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {/* Score Breakdown Bar Chart */}
      <div style={chartWrapper}>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
            <XAxis dataKey="name" stroke="#555" fontSize={10} />
            <YAxis stroke="#555" fontSize={10} />
            <Tooltip 
              contentStyle={{ background: '#111118', border: '1px solid #1e1e2e' }}
              itemStyle={{ color: '#fff' }}
            />
            <Bar dataKey="value">
              {barData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Health Improvement Pie Chart */}
      <div style={chartWrapper}>
        <ResponsiveContainer width="100%" height={150}>
          <PieChart>
            <Pie
              data={pieData}
              innerRadius={40}
              outerRadius={60}
              paddingAngle={5}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ background: '#111118', border: '1px solid #1e1e2e' }}
              itemStyle={{ color: '#fff' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const chartWrapper = {
  background: '#0a0a0f',
  padding: 12,
  borderRadius: 12,
  border: '1px solid #1e1e2e'
};

export default ScoreCharts;
