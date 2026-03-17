'use client';

import React from 'react';

interface MetricItem {
  label: string;
  value: string;
  hint: string;
}

interface MetricsProps {
  items: MetricItem[];
}

export const Metrics: React.FC<MetricsProps> = ({ items }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item: MetricItem, idx: number) => (
        <article 
          key={item.label} 
          className="glass p-6 animate-rise" 
          style={{ animationDelay: `${idx * 100}ms` }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--text-muted)]">
            {item.label}
          </p>
          <p className="mt-3 text-3xl font-bold text-white">
            {item.value}
          </p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            {item.hint}
          </p>
        </article>
      ))}
    </div>
  );
};
