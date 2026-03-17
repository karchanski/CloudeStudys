'use client';

import React from 'react';
import { useAuth } from '../lib/auth';
import { LoadingSkeleton } from './ui_states';
import { Sidebar } from './sidebar';

export function Shell({
  children,
  title,
  description,
  action,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  const { ready, user } = useAuth();

  if (!ready) {
    return (
      <main className="min-h-screen bg-[var(--bg-dark)] p-4">
        <div className="mx-auto max-w-[1440px]">
          <LoadingSkeleton lines={8} />
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[var(--bg-dark)] p-4">
      <div className="mx-auto flex max-w-[1440px] gap-6">
        <Sidebar />
        <section className="glass flex-1 overflow-hidden p-8">
          <div className="mb-8 flex items-center justify-between border-b border-[var(--border-subtle)] pb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--red-primary)]">Control Center</p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">{title}</h1>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{description}</p>
            </div>
            {action ?? null}
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
