'use client';

import { useEffect, useState } from 'react';

import { Shell } from '../../components/shell';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../components/ui_states';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import type { MoodleStatus } from '../../lib/types';

export default function MoodlePage() {
  const { accessToken, user } = useAuth();
  const [status, setStatus] = useState<MoodleStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadStatus(token: string) {
    const nextStatus = await api.getMoodleStatus(token);
    setStatus(nextStatus);
  }

  useEffect(() => {
    if (!accessToken || user?.role !== 'admin') {
      setLoading(false);
      return;
    }

    loadStatus(accessToken)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load Moodle status'))
      .finally(() => setLoading(false));
  }, [accessToken, user]);

  async function handleSync() {
    if (!accessToken) {
      return;
    }
    setSyncing(true);
    setError(null);
    setMessage(null);
    try {
      const result = await api.syncMoodle(accessToken);
      await loadStatus(accessToken);
      setMessage(`Moodle sync completed. Synchronized ${result.synced} courses.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sync Moodle');
    } finally {
      setSyncing(false);
    }
  }

  async function handleTestConnection() {
    if (!accessToken) {
      return;
    }
    setTesting(true);
    setError(null);
    setMessage(null);
    try {
      const result = await api.testMoodleConnection(accessToken);
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to test Moodle connection');
    } finally {
      setTesting(false);
    }
  }

  return (
    <Shell
      title="Moodle"
      description="Monitor Moodle integration, test connectivity, and launch manual synchronization from the admin workspace."
      action={
        user?.role === 'admin' ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleTestConnection()}
              disabled={testing}
              className="rounded-xl border border-indigo-300/35 bg-indigo-300/10 px-3 py-2 text-sm text-indigo-100 transition hover:bg-indigo-300/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              type="button"
              onClick={() => void handleSync()}
              disabled={syncing}
              className="glow rounded-xl border border-cyan-300/50 bg-cyan-300/10 px-3 py-2 text-sm text-cyan-100 transition hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {syncing ? 'Syncing...' : 'Run Sync'}
            </button>
          </div>
        ) : null
      }
    >
      {user?.role !== 'admin' ? <ErrorState title="Restricted section" subtitle="Only administrators can access Moodle integration controls." /> : null}
      {user?.role === 'admin' && loading ? <LoadingSkeleton lines={8} /> : null}
      {user?.role === 'admin' && error ? <ErrorState title="Moodle unavailable" subtitle={error} /> : null}
      {message ? <p className="mb-4 rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">{message}</p> : null}

      {user?.role === 'admin' && !loading && !error && status ? (
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-4">
            {[
              ['Base URL', status.base_url],
              ['Auth Mode', status.auth_mode],
              ['Token', status.has_token ? 'configured' : 'missing'],
              ['Credentials', status.has_credentials ? 'configured' : 'missing'],
            ].map(([label, value], index) => (
              <article key={label} className="glass soft-shadow animate-rise p-4" style={{ animationDelay: `${index * 45}ms` }}>
                <p className="text-xs uppercase tracking-[0.15em] text-indigo-200/70">{label}</p>
                <p className="mt-3 break-all text-lg font-semibold text-cyan-300">{value}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="glass soft-shadow p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Last sync</h3>
                <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2 py-1 text-xs text-cyan-100">
                  {status.last_sync?.status ?? 'never'}
                </span>
              </div>
              {status.last_sync ? (
                <div className="mt-4 space-y-3 text-sm">
                  <div className="rounded-2xl border border-indigo-300/15 bg-slate-950/30 p-4">
                    <p className="text-indigo-200/60">Started</p>
                    <p className="mt-1 text-white">{new Date(status.last_sync.started_at).toLocaleString()}</p>
                  </div>
                  <div className="rounded-2xl border border-indigo-300/15 bg-slate-950/30 p-4">
                    <p className="text-indigo-200/60">Finished</p>
                    <p className="mt-1 text-white">{status.last_sync.finished_at ? new Date(status.last_sync.finished_at).toLocaleString() : 'Still running'}</p>
                  </div>
                  <div className="rounded-2xl border border-indigo-300/15 bg-slate-950/30 p-4">
                    <p className="text-indigo-200/60">Result</p>
                    <p className="mt-1 text-white">{status.last_sync.message}</p>
                    <p className="mt-2 text-sm text-indigo-100/70">Courses synchronized: {status.last_sync.synced}</p>
                  </div>
                </div>
              ) : (
                <EmptyState title="No sync history yet" subtitle="Run the first Moodle sync to populate courses from the integration." />
              )}
            </section>

            <section className="glass soft-shadow p-5">
              <h3 className="text-lg font-semibold text-white">Sync log</h3>
              {status.recent_logs.length ? (
                <div className="mt-4 space-y-3">
                  {status.recent_logs.map((entry, index) => (
                    <article key={`${entry.started_at}-${index}`} className="rounded-2xl border border-indigo-300/15 bg-slate-950/30 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-white">{entry.message}</p>
                          <p className="mt-2 text-xs text-indigo-200/60">Started: {new Date(entry.started_at).toLocaleString()}</p>
                          <p className="text-xs text-indigo-200/60">Finished: {entry.finished_at ? new Date(entry.finished_at).toLocaleString() : 'Still running'}</p>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-xs ${entry.status === 'success' ? 'border border-emerald-300/30 bg-emerald-300/10 text-emerald-100' : entry.status === 'error' ? 'border border-rose-300/30 bg-rose-300/10 text-rose-100' : 'border border-cyan-300/30 bg-cyan-300/10 text-cyan-100'}`}>
                          {entry.status}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-indigo-100/75">Courses synchronized: {entry.synced}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState title="No log entries" subtitle="Connection tests and sync runs will appear here once you start using the integration." />
              )}
            </section>
          </div>
        </div>
      ) : null}
    </Shell>
  );
}
