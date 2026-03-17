'use client';

import { FormEvent, useEffect, useState } from 'react';

import { Shell } from '../../components/shell';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../components/ui_states';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import type { Homework, HomeworkSubmissionReview } from '../../lib/types';

export default function ReviewsPage() {
  const { accessToken, user } = useAuth();
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [selectedHomeworkId, setSelectedHomeworkId] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<HomeworkSubmissionReview[]>([]);
  const [drafts, setDrafts] = useState<Record<number, { grade: string; feedback: string }>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !user) {
      return;
    }
    if (user.role === 'admin' || user.role === 'teacher' || user.role === 'student') {
      api
        .getTeacherHomework(accessToken)
        .then((rows) => {
          setHomeworkList(rows);
          if (rows[0]) {
            setSelectedHomeworkId(rows[0].id);
          }
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load homework review list'))
        .finally(() => setLoading(false));
    }
  }, [accessToken, user]);

  useEffect(() => {
    if (!accessToken || !selectedHomeworkId) {
      return;
    }
    api
      .getHomeworkSubmissions(accessToken, selectedHomeworkId)
      .then((rows) => {
        setSubmissions(rows);
        setDrafts(
          Object.fromEntries(
            rows.map((item) => [item.submission_id, { grade: item.grade?.toString() ?? '', feedback: item.feedback ?? '' }]),
          ),
        );
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load submissions'));
  }, [accessToken, selectedHomeworkId]);

  async function handleSave(event: FormEvent, submissionId: number) {
    event.preventDefault();
    if (!accessToken) {
      return;
    }
    setSavingId(submissionId);
    setError(null);
    setMessage(null);
    try {
      const draft = drafts[submissionId];
      await api.reviewHomeworkSubmission(accessToken, submissionId, {
        grade: draft?.grade ? Number(draft.grade) : null,
        feedback: draft?.feedback || null,
      });
      const rows = await api.getHomeworkSubmissions(accessToken, selectedHomeworkId!);
      setSubmissions(rows);
      setMessage('Submission reviewed and synced.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save review');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Shell title="Reviews" description="Check homework submissions, leave feedback, and mirror grades to Google Sheets when configured.">
      {loading ? <LoadingSkeleton lines={8} /> : null}
      {error ? <ErrorState title="Reviews unavailable" subtitle={error} /> : null}
      {message ? <p className="mb-4 rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">{message}</p> : null}

      {!loading && !error ? (
        homeworkList.length ? (
          <div className="space-y-4">
            <div className="glass soft-shadow p-4">
              <label className="block">
                <span className="mb-1 block text-sm text-indigo-200">Homework</span>
                <select
                  value={selectedHomeworkId ?? ''}
                  onChange={(event) => setSelectedHomeworkId(Number(event.target.value))}
                  className="w-full rounded-2xl border border-indigo-300/25 bg-slate-950/40 px-4 py-3 outline-none"
                >
                  {homeworkList.map((item) => (
                    <option key={item.id} value={item.id}>
                      {(item.course_name ?? `Course #${item.course_id}`)} - {item.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {submissions.length ? (
              <div className="space-y-3">
                {submissions.map((submission) => (
                  <form
                    key={submission.submission_id}
                    onSubmit={(event) => void handleSave(event, submission.submission_id)}
                    className="glass soft-shadow p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.15em] text-indigo-200/65">{submission.course_name}</p>
                        <h3 className="mt-2 text-xl font-semibold text-cyan-300">{submission.student_name}</h3>
                        <p className="mt-2 text-sm text-indigo-100/75">{submission.homework_title}</p>
                        <p className="mt-2 text-xs text-indigo-200/60">Submitted: {new Date(submission.submitted_at).toLocaleString()}</p>
                        <p className="mt-2 text-xs text-indigo-200/60">File: {submission.file_url}</p>
                      </div>
                      <div className="w-full max-w-xs space-y-3">
                        <label className="block">
                          <span className="mb-1 block text-sm text-indigo-200">Grade</span>
                          <input
                            value={drafts[submission.submission_id]?.grade ?? ''}
                            onChange={(event) =>
                              setDrafts((current) => ({
                                ...current,
                                [submission.submission_id]: {
                                  grade: event.target.value,
                                  feedback: current[submission.submission_id]?.feedback ?? '',
                                },
                              }))
                            }
                            className="w-full rounded-2xl border border-indigo-300/25 bg-slate-950/40 px-4 py-3 outline-none"
                            placeholder="e.g. 95"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-sm text-indigo-200">Feedback</span>
                          <textarea
                            value={drafts[submission.submission_id]?.feedback ?? ''}
                            onChange={(event) =>
                              setDrafts((current) => ({
                                ...current,
                                [submission.submission_id]: {
                                  grade: current[submission.submission_id]?.grade ?? '',
                                  feedback: event.target.value,
                                },
                              }))
                            }
                            rows={4}
                            className="w-full rounded-2xl border border-indigo-300/25 bg-slate-950/40 px-4 py-3 outline-none"
                          />
                        </label>
                        <button
                          type="submit"
                          disabled={savingId === submission.submission_id}
                          className="rounded-2xl border border-cyan-300/35 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-50 transition hover:bg-cyan-300/20 disabled:opacity-60"
                        >
                          {savingId === submission.submission_id ? 'Saving...' : 'Save Review'}
                        </button>
                      </div>
                    </div>
                  </form>
                ))}
              </div>
            ) : (
              <EmptyState title="No submissions yet" subtitle="Students have not uploaded homework for the selected assignment yet." />
            )}
          </div>
        ) : (
          <EmptyState title="No homework to review" subtitle="Create homework first, then submissions will appear here for review." />
        )
      ) : null}
    </Shell>
  );
}
