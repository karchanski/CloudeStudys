'use client';

import { useEffect, useState } from 'react';

import { Metrics } from '../../components/metrics';
import { Shell } from '../../components/shell';
import { ErrorState, LoadingSkeleton } from '../../components/ui_states';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import type { StudentProfile } from '../../lib/types';

export default function ProfilePage() {
  const { accessToken, user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [linkExpiry, setLinkExpiry] = useState<number | null>(null);
  const [assistantCode, setAssistantCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || user?.role !== 'student') {
      setLoading(false);
      return;
    }

    api
      .getStudentProfile(accessToken)
      .then(setProfile)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load profile'))
      .finally(() => setLoading(false));
  }, [accessToken, user]);

  async function generateLinkCode() {
    if (!accessToken) {
      return;
    }
    setLinking(true);
    setLinkError(null);
    try {
      const result = await api.createTelegramLinkCode(accessToken);
      setLinkCode(result.code);
      setLinkExpiry(result.expires_in_seconds);
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : 'Unable to generate link code');
    } finally {
      setLinking(false);
    }
  }

  async function submitAssistantCode() {
    if (!accessToken || !assistantCode.trim()) {
      return;
    }
    setAssistantMessage(null);
    setLinkError(null);
    try {
      await api.linkAssistantCode(accessToken, assistantCode.trim().toUpperCase());
      const refreshed = await api.getStudentProfile(accessToken);
      setProfile(refreshed);
      setAssistantCode('');
      setAssistantMessage('You are now linked as assistant for the selected course.');
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : 'Unable to link assistant code');
    }
  }

  return (
    <Shell title="Profile" description="Your student account, group, Telegram linkage, and academic snapshot.">
      {user?.role !== 'student' ? <ErrorState title="Student section only" subtitle="This profile page is available only for student accounts." /> : null}
      {user?.role === 'student' && loading ? <LoadingSkeleton lines={8} /> : null}
      {user?.role === 'student' && error ? <ErrorState title="Unable to load profile" subtitle={error} /> : null}
      {user?.role === 'student' && !loading && !error && profile ? (
        <div className="space-y-4">
          <Metrics
            items={[
              { label: 'Courses', value: String(profile.courses_count), hint: 'Linked to your group' },
              { label: 'Homework', value: String(profile.homework_count), hint: 'Visible assignments' },
              { label: 'Attendance', value: `${profile.attendance_percent}%`, hint: 'Overall attendance rate' },
              { label: 'Updates', value: String(profile.notifications_count), hint: 'Unread or recent notifications' },
              { label: 'Assistant', value: String(profile.assistant_courses_count), hint: 'Courses where you can help review' },
            ]}
          />
          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="glass soft-shadow p-5">
              <h3 className="text-lg font-semibold text-white">Account</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="rounded-2xl border border-indigo-300/15 bg-slate-950/30 p-4">
                  <p className="text-indigo-200/60">Name</p>
                  <p className="mt-1 text-white">{profile.name}</p>
                </div>
                <div className="rounded-2xl border border-indigo-300/15 bg-slate-950/30 p-4">
                  <p className="text-indigo-200/60">Email</p>
                  <p className="mt-1 text-white">{profile.email}</p>
                </div>
                <div className="rounded-2xl border border-indigo-300/15 bg-slate-950/30 p-4">
                  <p className="text-indigo-200/60">Group</p>
                  <p className="mt-1 text-white">{profile.group_name ?? 'No group assigned yet'}</p>
                </div>
                <div className="rounded-2xl border border-indigo-300/15 bg-slate-950/30 p-4">
                  <p className="text-indigo-200/60">Telegram</p>
                  <p className="mt-1 text-white">{profile.telegram_id ?? 'Not linked'}</p>
                  <div className="mt-4 space-y-3">
                    <button
                      type="button"
                      onClick={() => void generateLinkCode()}
                      disabled={linking}
                      className="rounded-2xl border border-cyan-300/35 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-50 transition hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {linking ? 'Generating...' : 'Generate Telegram Link Code'}
                    </button>
                    {linkCode ? (
                      <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/8 p-4">
                        <p className="text-xs uppercase tracking-[0.15em] text-cyan-100/70">One-time code</p>
                        <p className="mt-2 text-3xl font-semibold tracking-[0.18em] text-cyan-300">{linkCode}</p>
                        <p className="mt-2 text-sm text-indigo-100/70">Open the Telegram bot and send `/register`, then enter this code. Expires in about {linkExpiry ?? 0} seconds.</p>
                      </div>
                    ) : null}
                    {linkError ? <p className="text-sm text-rose-200">{linkError}</p> : null}
                  </div>
                </div>
                <div className="rounded-2xl border border-indigo-300/15 bg-slate-950/30 p-4">
                  <p className="text-indigo-200/60">Become assistant</p>
                  <p className="mt-1 text-sm text-indigo-100/75">Enter the one-time code from your teacher to become assistant for a course.</p>
                  <div className="mt-4 flex gap-2">
                    <input
                      value={assistantCode}
                      onChange={(event) => setAssistantCode(event.target.value)}
                      className="flex-1 rounded-2xl border border-indigo-300/25 bg-slate-950/40 px-4 py-3 outline-none"
                      placeholder="ASSIST code"
                    />
                    <button
                      type="button"
                      onClick={() => void submitAssistantCode()}
                      className="rounded-2xl border border-violet-300/35 bg-violet-300/10 px-4 py-3 text-sm text-violet-100 transition hover:bg-violet-300/20"
                    >
                      Link
                    </button>
                  </div>
                  {assistantMessage ? <p className="mt-3 text-sm text-emerald-200">{assistantMessage}</p> : null}
                </div>
              </div>
            </section>
            <section className="glass soft-shadow p-5">
              <h3 className="text-lg font-semibold text-white">Student status</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <article className="rounded-2xl border border-cyan-300/20 bg-cyan-300/8 p-4">
                  <p className="text-xs uppercase tracking-[0.15em] text-cyan-100/70">Attendance health</p>
                  <p className="mt-3 text-3xl font-semibold text-cyan-300">{profile.attendance_percent}%</p>
                  <p className="mt-2 text-sm text-indigo-100/70">Based on all attendance records stored for your account.</p>
                </article>
                <article className="rounded-2xl border border-violet-300/20 bg-violet-300/8 p-4">
                  <p className="text-xs uppercase tracking-[0.15em] text-violet-100/70">Bot connection</p>
                  <p className="mt-3 text-xl font-semibold text-violet-200">{profile.telegram_id ? 'Connected' : 'Pending'}</p>
                  <p className="mt-2 text-sm text-indigo-100/70">Telegram notifications use the same backend account link.</p>
                </article>
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </Shell>
  );
}
