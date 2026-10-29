import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,} from 'recharts';
import { demoMetrics } from '../../data/demoData.js';

export default function MetricsChart({ data = demoMetrics.perClass }) {
  const chartData = data.map((item) => ({
    name: item.label,
    Precision: +(item.precision * 100).toFixed(1),
    Recall: +(item.recall * 100).toFixed(1),
    F1Score: +(item.f1 * 100).toFixed(1),
    AUC: +(item.auc * 100).toFixed(1),
  }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <YAxis
            domain={[70, 100]}
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={{ stroke: '#cbd5e1' }}
            unit="%"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#ffffff',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
          <Bar dataKey="Precision" fill="#6366f1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Recall" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="F1Score" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}