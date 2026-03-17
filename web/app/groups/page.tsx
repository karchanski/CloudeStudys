'use client';

import { FormEvent, useEffect, useState } from 'react';

import { Shell } from '../../components/shell';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../components/ui_states';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import type { Course, Group } from '../../lib/types';

const initialForm = {
  name: '',
  course_id: '',
};

export default function GroupsPage() {
  const { accessToken, user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadData() {
    if (!accessToken) {
      return;
    }
    const [groupsData, coursesData] = await Promise.all([api.getAdminGroups(accessToken), api.getAdminCourses(accessToken)]);
    setGroups(groupsData);
    setCourses(coursesData);
  }

  useEffect(() => {
    if (!accessToken || user?.role !== 'admin') {
      setLoading(false);
      return;
    }

    loadData()
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load groups'))
      .finally(() => setLoading(false));
  }, [accessToken, user]);

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) {
      return;
    }
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {
        name: form.name,
        course_id: form.course_id ? Number(form.course_id) : null,
      };
      if (editingId) {
        await api.updateAdminGroup(accessToken, editingId, payload);
        setMessage('Group updated.');
      } else {
        await api.createAdminGroup(accessToken, payload);
        setMessage('Group created.');
      }
      await loadData();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save group');
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(group: Group) {
    setEditingId(group.id);
    setForm({
      name: group.name,
      course_id: group.course_id ? String(group.course_id) : '',
    });
  }

  async function handleDelete(groupId: number) {
    if (!accessToken) {
      return;
    }
    setError(null);
    setMessage(null);
    try {
      await api.deleteAdminGroup(accessToken, groupId);
      await loadData();
      if (editingId === groupId) {
        resetForm();
      }
      setMessage('Group deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete group');
    }
  }

  return (
    <Shell title="Groups" description="Admin CRUD for academic groups and their course bindings.">
      {user?.role !== 'admin' ? <ErrorState title="Restricted section" subtitle="Only administrators can access groups management." /> : null}
      {user?.role === 'admin' && loading ? <LoadingSkeleton lines={8} /> : null}
      {user?.role === 'admin' && error ? <ErrorState title="Unable to load groups" subtitle={error} /> : null}
      {message ? <p className="mb-4 rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">{message}</p> : null}

      {user?.role === 'admin' && !loading && !error ? (
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <form className="glass soft-shadow space-y-4 p-5" onSubmit={handleSubmit}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{editingId ? 'Edit group' : 'Create group'}</h3>
              {editingId ? (
                <button type="button" onClick={resetForm} className="text-sm text-indigo-200/70 transition hover:text-white">
                  Cancel
                </button>
              ) : null}
            </div>
            <label className="block">
              <span className="mb-1 block text-sm text-indigo-200">Group name</span>
              <input value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} className="w-full rounded-2xl border border-indigo-300/25 bg-slate-950/40 px-4 py-3 outline-none" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-indigo-200">Course</span>
              <select value={form.course_id} onChange={(e) => setForm((c) => ({ ...c, course_id: e.target.value }))} className="w-full rounded-2xl border border-indigo-300/25 bg-slate-950/40 px-4 py-3 outline-none">
                <option value="">No linked course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" disabled={submitting || !form.name.trim()} className="glow w-full rounded-2xl border border-cyan-300/50 bg-cyan-300/10 px-4 py-3 font-medium text-cyan-50 transition hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? 'Saving...' : editingId ? 'Update Group' : 'Create Group'}
            </button>
          </form>

          {groups.length ? (
            <div className="glass soft-shadow overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-indigo-300/20 text-indigo-200">
                  <tr>
                    <th className="p-3">Group</th>
                    <th className="p-3">Course</th>
                    <th className="p-3">Students</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <tr key={group.id} className="border-b border-indigo-300/10">
                      <td className="p-3 font-medium">{group.name}</td>
                      <td className="p-3">{group.course_name ?? '-'}</td>
                      <td className="p-3">{group.student_count ?? 0}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => startEdit(group)} className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-xs text-cyan-100">
                            Edit
                          </button>
                          <button type="button" onClick={() => void handleDelete(group.id)} className="rounded-xl border border-rose-300/30 bg-rose-300/10 px-3 py-2 text-xs text-rose-100">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No groups found" subtitle="Create the first academic group from the form on the left." />
          )}
        </div>
      ) : null}
    </Shell>
  );
}
