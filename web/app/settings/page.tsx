'use client';

import { FormEvent, useEffect, useState } from 'react';

import { Shell } from '../../components/shell';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import type { AuthSessionInfo } from '../../lib/types';
import { describeUserAgent, summarizeUserAgent } from '../../lib/user_agent';

const API_URL_KEY = 'smartedu.web.apiBaseUrl.note';
const MOODLE_URL_KEY = 'smartedu.web.moodleUrl.note';

export default function SettingsPage() {
  const { accessToken, logout, logoutAll, refreshUser, user } = useAuth();
  const [apiUrl, setApiUrl] = useState(api.baseUrl);
  const [moodleUrl, setMoodleUrl] = useState('http://moodle.local');
  const [message, setMessage] = useState<string | null>(null);
  const [sessions, setSessions] = useState<AuthSessionInfo[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [busySessionId, setBusySessionId] = useState<number | null>(null);
  const [logoutAllBusy, setLogoutAllBusy] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setApiUrl(window.localStorage.getItem(API_URL_KEY) || api.baseUrl);
    setMoodleUrl(window.localStorage.getItem(MOODLE_URL_KEY) || 'http://moodle.local');
  }, []);

  useEffect(() => {
    if (!accessToken) {
      setSessionsLoading(false);
      return;
    }

    setSessionsLoading(true);
    setSessionsError(null);
    api
      .getAuthSessions(accessToken)
      .then(setSessions)
      .catch((err) => setSessionsError(err instanceof Error ? err.message : 'Unable to load active sessions'))
      .finally(() => setSessionsLoading(false));
  }, [accessToken]);

  function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(API_URL_KEY, apiUrl);
      window.localStorage.setItem(MOODLE_URL_KEY, moodleUrl);
    }
    setMessage('Settings saved locally for this browser.');
  }

  async function reloadSessions() {
    if (!accessToken) {
      return;
    }
    setSessionsLoading(true);
    setSessionsError(null);
    try {
      const rows = await api.getAuthSessions(accessToken);
      setSessions(rows);
    } catch (err) {
      setSessionsError(err instanceof Error ? err.message : 'Unable to load active sessions');
    } finally {
      setSessionsLoading(false);
    }
  }

  async function handleRevokeSession(session: AuthSessionInfo) {
    if (!accessToken) {
      return;
    }
    setBusySessionId(session.id);
    setActionMessage(null);
    setSessionsError(null);
    try {
      await api.revokeAuthSession(accessToken, session.id);
      if (session.is_current) {
        await logout();
        return;
      }
      await reloadSessions();
      setActionMessage('Session revoked.');
    } catch (err) {
      setSessionsError(err instanceof Error ? err.message : 'Unable to revoke session');
    } finally {
      setBusySessionId(null);
    }
  }

  async function handleLogoutAll() {
    setLogoutAllBusy(true);
    setActionMessage(null);
    setSessionsError(null);
    try {
      await logoutAll();
    } catch (err) {
      setSessionsError(err instanceof Error ? err.message : 'Unable to close all sessions');
    } finally {
      setLogoutAllBusy(false);
    }
  }

  return (
    <Shell title="Settings" description="Current account context and deployment endpoints used by the web workspace.">
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="glass soft-shadow p-5">
          <h3 className="text-lg font-semibold text-white">Session</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-2xl border border-indigo-300/15 bg-slate-950/30 p-4">
              <p className="text-indigo-200/60">User</p>
              <p className="mt-1 text-white">{user?.name ?? '-'}</p>
            </div>
            <div className="rounded-2xl border border-indigo-300/15 bg-slate-950/30 p-4">
              <p className="text-indigo-200/60">Email</p>
              <p className="mt-1 text-white">{user?.email ?? '-'}</p>
            </div>
            <div className="rounded-2xl border border-indigo-300/15 bg-slate-950/30 p-4">
              <p className="text-indigo-200/60">Role</p>
              <p className="mt-1 text-white capitalize">{user?.role ?? '-'}</p>
            </div>
            <button
              type="button"
              onClick={() => void refreshUser()}
              className="rounded-2xl border border-cyan-300/35 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-50 transition hover:bg-cyan-300/20"
            >
              Refresh session data
            </button>
            <button
              type="button"
              onClick={() => void handleLogoutAll()}
              disabled={logoutAllBusy}
              className="rounded-2xl border border-rose-300/35 bg-rose-300/10 px-4 py-3 text-sm text-rose-100 transition hover:bg-rose-300/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {logoutAllBusy ? 'Closing sessions...' : 'Logout all devices'}
            </button>
          </div>
        </section>

        <form className="glass soft-shadow space-y-4 p-5" onSubmit={saveSettings}>
          <h3 className="text-lg font-semibold text-white">Environment notes</h3>
          <p className="text-sm text-indigo-100/75">
            The live API endpoint is controlled by `NEXT_PUBLIC_API_BASE_URL` at build time. These values are stored as deployment notes in the browser.
          </p>
          <label className="block">
            <span className="mb-1 block text-sm text-indigo-200">API Base URL</span>
            <input
              value={apiUrl}
              onChange={(event) => setApiUrl(event.target.value)}
              className="w-full rounded-2xl border border-indigo-300/25 bg-slate-950/50 px-4 py-3 outline-none transition focus:border-cyan-300/50"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-indigo-200">Moodle URL</span>
            <input
              value={moodleUrl}
              onChange={(event) => setMoodleUrl(event.target.value)}
              className="w-full rounded-2xl border border-indigo-300/25 bg-slate-950/50 px-4 py-3 outline-none transition focus:border-cyan-300/50"
            />
          </label>
          {message ? <p className="rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">{message}</p> : null}
          <button className="glow rounded-2xl border border-cyan-300/50 bg-cyan-300/10 px-4 py-3 text-sm font-medium text-cyan-50 transition hover:bg-cyan-300/20">
            Save Notes
          </button>
        </form>
      </div>
      <section className="glass soft-shadow mt-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">Active sessions</h3>
            <p className="mt-1 text-sm text-indigo-100/70">Refresh-token sessions stored on the server for this account.</p>
          </div>
          <button
            type="button"
            onClick={() => void reloadSessions()}
            disabled={sessionsLoading || !accessToken}
            className="rounded-2xl border border-cyan-300/35 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-50 transition hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sessionsLoading ? 'Refreshing...' : 'Reload sessions'}
          </button>
        </div>
        {actionMessage ? <p className="mt-4 rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">{actionMessage}</p> : null}
        {sessionsError ? <p className="mt-4 rounded-xl border border-rose-300/25 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">{sessionsError}</p> : null}
        {!sessionsLoading && !sessions.length ? (
          <p className="mt-4 rounded-2xl border border-indigo-300/15 bg-slate-950/30 px-4 py-4 text-sm text-indigo-100/75">No refresh sessions found for this account.</p>
        ) : null}
        <div className="mt-4 space-y-3">
          {sessions.map((session) => (
            <article key={session.id} className="rounded-2xl border border-indigo-300/15 bg-slate-950/30 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1 text-sm">
                  <p className="text-white">
                    Session #{session.id} {session.is_current ? <span className="text-cyan-300">(Current)</span> : null}
                  </p>
                  <p className="text-indigo-100/85">{describeUserAgent(session.user_agent)}</p>
                  {session.user_agent ? <p className="text-xs text-indigo-100/55">{summarizeUserAgent(session.user_agent)}</p> : null}
                  <p className="text-indigo-100/70">IP: {session.ip_address ?? 'Unknown'}</p>
                  <p className="text-indigo-100/70">Created: {new Date(session.created_at).toLocaleString()}</p>
                  <p className="text-indigo-100/70">
                    Last seen: {session.last_seen_at ? new Date(session.last_seen_at).toLocaleString() : 'Not tracked yet'}
                  </p>
                  <p className="text-indigo-100/70">Expires: {new Date(session.expires_at).toLocaleString()}</p>
                  <p className={session.revoked ? 'text-rose-200' : 'text-emerald-200'}>{session.revoked ? 'Revoked' : 'Active'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleRevokeSession(session)}
                  disabled={session.revoked || busySessionId === session.id}
                  className="rounded-2xl border border-rose-300/35 bg-rose-300/10 px-4 py-3 text-sm text-rose-100 transition hover:bg-rose-300/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busySessionId === session.id ? 'Revoking...' : session.is_current ? 'Logout this device' : 'Revoke'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </Shell>
  );
}
