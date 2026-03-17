'use client';

import { FormEvent, useEffect, useState } from 'react';

import { Shell } from '../../components/shell';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../components/ui_states';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import type { Homework, TeacherCourse } from '../../lib/types';

function initialTeacherForm() {
  return {
    courseId: '',
    title: '',
    description: '',
    removeFile: false,
  };
}

export default function HomeworkPage() {
  const { accessToken, user } = useAuth();
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [studentHomework, setStudentHomework] = useState<Homework[]>([]);
  const [form, setForm] = useState(initialTeacherForm);
  const [file, setFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [studentFiles, setStudentFiles] = useState<Record<number, File | null>>({});

  async function loadTeacherData(token: string) {
    const [courseList, homeworkList] = await Promise.all([api.getTeacherCourses(token), api.getTeacherHomework(token)]);
    setCourses(courseList);
    setHomework(homeworkList);
    setForm((current) => ({
      ...current,
      courseId: current.courseId || (courseList[0] ? String(courseList[0].id) : ''),
    }));
  }

  useEffect(() => {
    if (!accessToken || !user) {
      return;
    }

    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        if (user.role === 'student') {
          setStudentHomework(await api.getStudentHomework(accessToken));
          return;
        }

        await loadTeacherData(accessToken);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load homework');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [accessToken, user]);

  function resetForm() {
    setEditingId(null);
    setFile(null);
    setForm((current) => ({
      ...initialTeacherForm(),
      courseId: courses[0] ? String(courses[0].id) : '',
    }));
  }

  function startEdit(item: Homework) {
    setEditingId(item.id);
    setFile(null);
    setForm({
      courseId: String(item.course_id),
      title: item.title,
      description: item.description,
      removeFile: false,
    });
    setMessage(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || !form.courseId) {
      return;
    }

    const formData = new FormData();
    formData.append('course_id', form.courseId);
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('remove_file', String(form.removeFile));
    if (file) {
      formData.append('file', file);
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      if (editingId) {
        await api.updateHomework(accessToken, editingId, formData);
        setMessage('Homework updated successfully.');
      } else {
        await api.createHomework(accessToken, formData);
        setMessage('Homework published successfully.');
      }

      await loadTeacherData(accessToken);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save homework');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(homeworkId: number) {
    if (!accessToken) {
      return;
    }

    setError(null);
    setMessage(null);
    try {
      await api.deleteHomework(accessToken, homeworkId);
      await loadTeacherData(accessToken);
      if (editingId === homeworkId) {
        resetForm();
      }
      setMessage('Homework deleted successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete homework');
    }
  }

  async function handleStudentSubmit(homeworkId: number) {
    if (!accessToken || !studentFiles[homeworkId]) {
      return;
    }
    const formData = new FormData();
    formData.append('file', studentFiles[homeworkId] as File);
    setError(null);
    setMessage(null);
    try {
      await api.submitStudentHomework(accessToken, homeworkId, formData);
      setStudentHomework(await api.getStudentHomework(accessToken));
      setStudentFiles((current) => ({ ...current, [homeworkId]: null }));
      setMessage('Homework submitted successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit homework');
    }
  }

  return (
    <Shell
      title="Homework"
      description={user?.role === 'student' ? 'Assignments published for your courses.' : 'Create, update, and remove homework across web, mobile, and Telegram flows.'}
    >
      {loading ? <LoadingSkeleton lines={8} /> : null}
      {error ? <ErrorState title="Homework unavailable" subtitle={error} /> : null}
      {message ? <p className="mb-4 rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">{message}</p> : null}

      {!loading && !error && user?.role === 'student' ? (
        studentHomework.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {studentHomework.map((item, idx) => (
              <article key={item.id} className="glass soft-shadow animate-rise p-5" style={{ animationDelay: `${idx * 45}ms` }}>
                <p className="text-xs uppercase tracking-[0.15em] text-indigo-200/65">{item.course_name ?? `Course #${item.course_id}`}</p>
                <h3 className="mt-2 text-xl font-semibold text-cyan-300">{item.title}</h3>
                <p className="mt-3 text-sm text-indigo-100/80">{item.description}</p>
                <p className="mt-4 text-xs text-indigo-200/55">{item.file_url ? `Attachment: ${item.file_url}` : 'No attachment'}</p>
                <p className="mt-4 text-xs text-indigo-200/55">Published: {new Date(item.created_at).toLocaleString()}</p>
                <div className="mt-4 rounded-2xl border border-indigo-300/15 bg-slate-950/25 p-4">
                  <p className="text-sm text-white">{item.submission_id ? 'Submission uploaded' : 'No submission yet'}</p>
                  <p className="mt-2 text-xs text-indigo-200/60">{item.submitted_at ? `Submitted: ${new Date(item.submitted_at).toLocaleString()}` : 'Upload your solution file below.'}</p>
                  <p className="mt-2 text-xs text-indigo-200/60">{item.grade !== null && item.grade !== undefined ? `Grade: ${item.grade}` : 'Not graded yet'}</p>
                  <p className="mt-2 text-xs text-indigo-200/60">{item.feedback ? `Feedback: ${item.feedback}` : 'No feedback yet'}</p>
                  <div className="mt-4 flex gap-2">
                    <input
                      type="file"
                      onChange={(event) =>
                        setStudentFiles((current) => ({
                          ...current,
                          [item.id]: event.target.files?.[0] ?? null,
                        }))
                      }
                      className="flex-1 rounded-2xl border border-dashed border-indigo-300/25 bg-slate-950/20 px-4 py-3 text-sm text-indigo-100/75"
                    />
                    <button
                      type="button"
                      onClick={() => void handleStudentSubmit(item.id)}
                      className="rounded-2xl border border-cyan-300/35 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-50 transition hover:bg-cyan-300/20"
                    >
                      {item.submission_id ? 'Resubmit' : 'Submit'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No homework yet" subtitle="New assignments will appear here when your teacher publishes them." />
        )
      ) : null}

      {!loading && !error && user && user.role !== 'student' ? (
        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <form className="glass soft-shadow space-y-4 p-5" onSubmit={handleSubmit}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{editingId ? 'Edit homework' : 'Publish homework'}</h3>
              {editingId ? (
                <button type="button" onClick={resetForm} className="text-sm text-indigo-200/70 transition hover:text-white">
                  Cancel
                </button>
              ) : null}
            </div>
            <label className="block">
              <span className="mb-1 block text-sm text-indigo-200">Course</span>
              <select
                value={form.courseId}
                onChange={(event) => setForm((current) => ({ ...current, courseId: event.target.value }))}
                className="w-full rounded-2xl border border-indigo-300/25 bg-slate-950/40 px-4 py-3 outline-none transition focus:border-cyan-300/50"
              >
                <option value="">Select course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-indigo-200">Title</span>
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                className="w-full rounded-2xl border border-indigo-300/25 bg-slate-950/40 px-4 py-3 outline-none transition focus:border-cyan-300/50"
                placeholder="Homework title"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-indigo-200">Description</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                rows={6}
                className="w-full rounded-2xl border border-indigo-300/25 bg-slate-950/40 px-4 py-3 outline-none transition focus:border-cyan-300/50"
                placeholder="Detailed task description"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-indigo-200">Attachment</span>
              <input
                type="file"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="w-full rounded-2xl border border-dashed border-indigo-300/25 bg-slate-950/20 px-4 py-3 text-sm text-indigo-100/75"
              />
            </label>
            {editingId ? (
              <label className="flex items-center gap-2 text-sm text-indigo-100/75">
                <input
                  type="checkbox"
                  checked={form.removeFile}
                  onChange={(event) => setForm((current) => ({ ...current, removeFile: event.target.checked }))}
                />
                Remove existing attachment
              </label>
            ) : null}
            <button
              type="submit"
              disabled={submitting || !form.courseId || !form.title.trim() || !form.description.trim()}
              className="glow w-full rounded-2xl border border-cyan-300/50 bg-cyan-300/10 px-4 py-3 font-medium text-cyan-50 transition hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Saving...' : editingId ? 'Update Homework' : 'Publish Homework'}
            </button>
          </form>

          {homework.length ? (
            <div className="space-y-3">
              {homework.map((item, idx) => (
                <article key={item.id} className="glass soft-shadow animate-rise p-5" style={{ animationDelay: `${idx * 45}ms` }}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.15em] text-indigo-200/65">{item.course_name ?? `Course #${item.course_id}`}</p>
                      <h3 className="mt-2 text-xl font-semibold text-cyan-300">{item.title}</h3>
                    </div>
                    <p className="text-xs text-indigo-200/55">{new Date(item.created_at).toLocaleString()}</p>
                  </div>
                  <p className="mt-3 text-sm text-indigo-100/80">{item.description}</p>
                  <p className="mt-4 text-xs text-indigo-200/55">{item.file_url ? `Attachment: ${item.file_url}` : 'No attachment'}</p>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-xs text-cyan-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(item.id)}
                      className="rounded-xl border border-rose-300/30 bg-rose-300/10 px-3 py-2 text-xs text-rose-100"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No homework published yet" subtitle="Create the first assignment from the form on the left." />
          )}
        </div>
      ) : null}
    </Shell>
  );
}
