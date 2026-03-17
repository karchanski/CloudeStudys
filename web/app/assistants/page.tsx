'use client';

import { FormEvent, useEffect, useState } from 'react';

import { Shell } from '../../components/shell';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../components/ui_states';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import type { AssistantInvite, CourseAssistant, CourseWorkspace, TeacherCourse } from '../../lib/types';

export default function AssistantsPage() {
  const { accessToken, user } = useAuth();
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [assistants, setAssistants] = useState<CourseAssistant[]>([]);
  const [invite, setInvite] = useState<AssistantInvite | null>(null);
  const [workspace, setWorkspace] = useState<CourseWorkspace | null>(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadCourseScoped(token: string, courseId: number) {
    const [assistantRows, workspaceData] = await Promise.all([
      api.getCourseAssistants(token, courseId),
      api.getCourseWorkspace(token, courseId),
    ]);
    setAssistants(assistantRows);
    setWorkspace(workspaceData);
    setGoogleSheetUrl(workspaceData.google_sheet_url ?? '');
  }

  useEffect(() => {
    if (!accessToken || (user?.role !== 'teacher' && user?.role !== 'admin')) {
      setLoading(false);
      return;
    }
    api
      .getTeacherCourses(accessToken)
      .then(async (rows) => {
        setCourses(rows);
        if (rows[0]) {
          setSelectedCourseId(rows[0].id);
          await loadCourseScoped(accessToken, rows[0].id);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load assistants workspace'))
      .finally(() => setLoading(false));
  }, [accessToken, user]);

  useEffect(() => {
    if (!accessToken || !selectedCourseId) {
      return;
    }
    loadCourseScoped(accessToken, selectedCourseId).catch((err) => setError(err instanceof Error ? err.message : 'Unable to load course data'));
  }, [accessToken, selectedCourseId]);

  async function handleGenerateCode() {
    if (!accessToken || !selectedCourseId) {
      return;
    }
    setError(null);
    setMessage(null);
    try {
      const result = await api.createAssistantCode(accessToken, selectedCourseId);
      setInvite(result);
      setMessage('Assistant code generated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate assistant code');
    }
  }

  async function handleWorkspaceSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || !selectedCourseId) {
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const result = await api.updateCourseWorkspace(accessToken, selectedCourseId, {
        google_sheet_url: googleSheetUrl.trim() || null,
      });
      setWorkspace(result);
      setMessage('Course workspace updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save workspace');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Shell title="Assistants" description="Generate one-time assistant codes, link assistants to courses, and attach course Google Sheets.">
      {(user?.role !== 'teacher' && user?.role !== 'admin') ? <ErrorState title="Restricted section" subtitle="Assistants management is available only for teachers and admins." /> : null}
      {loading ? <LoadingSkeleton lines={8} /> : null}
      {error ? <ErrorState title="Assistants workspace unavailable" subtitle={error} /> : null}
      {message ? <p className="mb-4 rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">{message}</p> : null}

      {!loading && !error && user && (user.role === 'teacher' || user.role === 'admin') ? (
        courses.length ? (
          <div className="space-y-4">
            <div className="glass soft-shadow flex flex-col gap-4 p-4 lg:flex-row lg:items-end">
              <label className="block flex-1">
                <span className="mb-1 block text-sm text-indigo-200">Course</span>
                <select
                  value={selectedCourseId ?? ''}
                  onChange={(event) => setSelectedCourseId(Number(event.target.value))}
                  className="w-full rounded-2xl border border-indigo-300/25 bg-slate-950/40 px-4 py-3 outline-none"
                >
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => void handleGenerateCode()}
                className="glow rounded-2xl border border-cyan-300/50 bg-cyan-300/10 px-4 py-3 text-sm font-medium text-cyan-50 transition hover:bg-cyan-300/20"
              >
                Generate Assistant Code
              </button>
            </div>

            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <form className="glass soft-shadow space-y-4 p-5" onSubmit={handleWorkspaceSave}>
                <h3 className="text-lg font-semibold text-white">Course workspace</h3>
                <p className="text-sm text-indigo-100/75">Attach the Google Sheet where grades should be mirrored after homework review.</p>
                <label className="block">
                  <span className="mb-1 block text-sm text-indigo-200">Google Sheet URL</span>
                  <input
                    value={googleSheetUrl}
                    onChange={(event) => setGoogleSheetUrl(event.target.value)}
                    className="w-full rounded-2xl border border-indigo-300/25 bg-slate-950/40 px-4 py-3 outline-none"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                  />
                </label>
                <div className="rounded-2xl border border-indigo-300/15 bg-slate-950/30 p-4 text-sm text-indigo-100/75">
                  Moodle course id: <span className="text-white">{workspace?.moodle_id ?? 'not linked'}</span>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl border border-cyan-300/35 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-50 transition hover:bg-cyan-300/20 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Workspace'}
                </button>
                {invite ? (
                  <div className="rounded-2xl border border-violet-300/20 bg-violet-300/8 p-4">
                    <p className="text-xs uppercase tracking-[0.15em] text-violet-100/70">Assistant code</p>
                    <p className="mt-2 text-3xl font-semibold tracking-[0.18em] text-violet-200">{invite.code}</p>
                    <p className="mt-2 text-sm text-indigo-100/70">Student enters this once in profile to become assistant for the selected course.</p>
                  </div>
                ) : null}
              </form>

              {assistants.length ? (
                <div className="glass soft-shadow overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-indigo-300/20 text-indigo-200">
                      <tr>
                        <th className="p-3">Assistant</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Linked</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assistants.map((assistant) => (
                        <tr key={assistant.student_id} className="border-b border-indigo-300/10">
                          <td className="p-3 font-medium">{assistant.student_name}</td>
                          <td className="p-3">{assistant.student_email}</td>
                          <td className="p-3">{new Date(assistant.linked_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="No assistants yet" subtitle="Generate a one-time code and let a student enter it in their profile." />
              )}
            </div>
          </div>
        ) : (
          <EmptyState title="No courses available" subtitle="Create or sync a course first, then assign assistants to it." />
        )
      ) : null}
    </Shell>
  );
}
