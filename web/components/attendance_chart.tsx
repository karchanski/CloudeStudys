'use client';

import React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface ChartData {
  name: string;
  rate: number;
}

interface AttendanceChartProps {
  data: ChartData[];
}

export const AttendanceChart: React.FC<AttendanceChartProps> = ({ data }) => {
  return (
    <div className="glass p-6">
      <div className="mb-6 flex items-end justify-between">
        <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-white">Attendance by Course</h3>
        <span className="text-xs text-[var(--text-muted)]">{data.length ? 'Live' : 'No data'}</span>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <defs>
              <linearGradient id="barColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--red-primary)" stopOpacity={0.9} />
                <stop offset="100%" stopColor="var(--red-primary)" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
            <YAxis stroke="var(--text-muted)" fontSize={12} />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-dark)',
                color: 'white'
              }}
            />
            <Bar dataKey="rate" fill="url(#barColor)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
