'use client';

import { FormEvent, useEffect, useState } from 'react';

import { Shell } from '../../components/shell';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../components/ui_states';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import type { Group, User, UserRole } from '../../lib/types';

const initialForm = {
  name: '',
  email: '',
  password: '',
  role: 'student' as UserRole,
  group_id: '',
};

export default function UsersPage() {
  const { accessToken, user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
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
    const [usersData, groupsData] = await Promise.all([api.getAdminUsers(accessToken), api.getAdminGroups(accessToken)]);
    setUsers(usersData);
    setGroups(groupsData);
  }

  useEffect(() => {
    if (!accessToken || user?.role !== 'admin') {
      setLoading(false);
      return;
    }

    loadData()
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load users'))
      .finally(() => setLoading(false));
  }, [accessToken, user]);

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  function startEdit(item: User) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      email: item.email,
      password: '',
      role: item.role,
      group_id: item.group_id ? String(item.group_id) : '',
    });
    setMessage(null);
    setError(null);
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
        email: form.email,
        role: form.role,
        group_id: form.group_id ? Number(form.group_id) : null,
      };

      if (editingId) {
        const current = users.find((item) => item.id === editingId);
        await api.updateAdminUser(accessToken, editingId, {
          ...payload,
          telegram_id: current?.telegram_id ?? null,
        });
        setMessage('User updated.');
      } else {
        await api.createAdminUser(accessToken, {
          ...payload,
          password: form.password,
        });
        setMessage('User created.');
      }

      await loadData();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save user');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(userId: number) {
    if (!accessToken) {
      return;
    }
    setError(null);
    setMessage(null);
    try {
      await api.deleteAdminUser(accessToken, userId);
      await loadData();
      if (editingId === userId) {
        resetForm();
      }
      setMessage('User deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete user');
    }
  }

  return (
    <Shell title="Users" description="Admin control over Moodle-linked users, roles, group assignment, and Telegram linkage.">
      {user?.role !== 'admin' ? <ErrorState title="Restricted section" subtitle="Only administrators can access the users directory." /> : null}
      {user?.role === 'admin' && loading ? <LoadingSkeleton lines={8} /> : null}
      {user?.role === 'admin' && error ? <ErrorState title="Unable to load users" subtitle={error} /> : null}
      {message ? <p className="mb-4 rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">{message}</p> : null}

      {user?.role === 'admin' && !loading && !error ? (
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <form className="glass soft-shadow space-y-4 p-5" onSubmit={handleSubmit}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{editingId ? 'Edit user' : 'Create user'}</h3>
              {editingId ? (
                <button type="button" onClick={resetForm} className="text-sm text-indigo-200/70 transition hover:text-white">
                  Cancel
                </button>
              ) : null}
            </div>
            <p className="text-sm text-indigo-100/70">
              Standard sign-in happens through Moodle. This form is intended for admin-side correction, bootstrap, or support scenarios.
            </p>
            <label className="block">
              <span className="mb-1 block text-sm text-indigo-200">Name</span>
              <input value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} className="w-full rounded-2xl border border-indigo-300/25 bg-slate-950/40 px-4 py-3 outline-none" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-indigo-200">Email</span>
              <input value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} className="w-full rounded-2xl border border-indigo-300/25 bg-slate-950/40 px-4 py-3 outline-none" />
            </label>
            {!editingId ? (
              <label className="block">
                <span className="mb-1 block text-sm text-indigo-200">Password</span>
                <input type="password" value={form.password} onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))} className="w-full rounded-2xl border border-indigo-300/25 bg-slate-950/40 px-4 py-3 outline-none" />
              </label>
            ) : null}
            <label className="block">
              <span className="mb-1 block text-sm text-indigo-200">Role</span>
              <select value={form.role} onChange={(e) => setForm((c) => ({ ...c, role: e.target.value as UserRole }))} className="w-full rounded-2xl border border-indigo-300/25 bg-slate-950/40 px-4 py-3 outline-none">
                <option value="student">student</option>
                <option value="teacher">teacher</option>
                <option value="admin">admin</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-indigo-200">Group</span>
              <select value={form.group_id} onChange={(e) => setForm((c) => ({ ...c, group_id: e.target.value }))} className="w-full rounded-2xl border border-indigo-300/25 bg-slate-950/40 px-4 py-3 outline-none">
                <option value="">No group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={submitting || !form.name.trim() || !form.email.trim() || (!editingId && !form.password.trim())}
              className="glow w-full rounded-2xl border border-cyan-300/50 bg-cyan-300/10 px-4 py-3 font-medium text-cyan-50 transition hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Saving...' : editingId ? 'Update User' : 'Create User'}
            </button>
          </form>

          {users.length ? (
            <div className="glass soft-shadow overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-indigo-300/20 text-indigo-200">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Group</th>
                    <th className="p-3">Telegram</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => (
                    <tr key={item.id} className="border-b border-indigo-300/10 align-top">
                      <td className="p-3">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-indigo-100/70">{item.email}</p>
                      </td>
                      <td className="p-3 capitalize">{item.role}</td>
                      <td className="p-3">{groups.find((group) => group.id === item.group_id)?.name ?? '-'}</td>
                      <td className="p-3">{item.telegram_id ?? 'not linked'}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => startEdit(item)} className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-xs text-cyan-100">
                            Edit
                          </button>
                          <button type="button" onClick={() => void handleDelete(item.id)} className="rounded-xl border border-rose-300/30 bg-rose-300/10 px-3 py-2 text-xs text-rose-100">
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
            <EmptyState title="No users found" subtitle="Create the first user from the form on the left." />
          )}
        </div>
      ) : null}
    </Shell>
  );
}
