'use client';

import { FormEvent, useEffect, useState } from 'react';

import { Shell } from '../../components/shell';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../components/ui_states';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import type { Course, TeacherCourse, User } from '../../lib/types';

const initialForm = {
  name: '',
  teacher_id: '',
  moodle_id: '',
};

export default function CoursesPage() {
  const { accessToken, user } = useAuth();
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [adminCourses, setAdminCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [studentCourses, setStudentCourses] = useState<Array<{ id: number; name: string; teacher_id: number; teacher_name: string | null; moodle_id: string | null; group_id: number | null; group_name: string | null }>>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadAdminData() {
    if (!accessToken) {
      return;
    }
    const [coursesData, usersData] = await Promise.all([api.getAdminCourses(accessToken), api.getAdminUsers(accessToken)]);
    setAdminCourses(coursesData);
    setTeachers(usersData.filter((item) => item.role === 'teacher' || item.role === 'admin'));
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
          setStudentCourses(await api.getStudentCourses(accessToken));
          return;
        }
        if (user.role === 'admin') {
          await loadAdminData();
          return;
        }
        setCourses(await api.getTeacherCourses(accessToken));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load courses');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [accessToken, user]);

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  function startEdit(course: Course) {
    setEditingId(course.id);
    setForm({
      name: course.name,
      teacher_id: String(course.teacher_id),
      moodle_id: course.moodle_id ?? '',
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
        teacher_id: Number(form.teacher_id),
        moodle_id: form.moodle_id.trim() || null,
      };
      if (editingId) {
        await api.updateAdminCourse(accessToken, editingId, payload);
        setMessage('Course updated.');
      } else {
        await api.createAdminCourse(accessToken, payload);
        setMessage('Course created.');
      }
      await loadAdminData();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save course');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(courseId: number) {
    if (!accessToken) {
      return;
    }
    setError(null);
    setMessage(null);
    try {
      await api.deleteAdminCourse(accessToken, courseId);
      await loadAdminData();
      if (editingId === courseId) {
        resetForm();
      }
      setMessage('Course deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete course');
    }
  }

  return (
    <Shell
      title="Courses"
      description={
        user?.role === 'student'
          ? 'Courses assigned to your group.'
          : user?.role === 'admin'
            ? 'Admin CRUD for course catalog and teacher assignment.'
            : 'Manage active classes and monitor attendance in one place.'
      }
    >
      {loading ? <LoadingSkeleton lines={8} /> : null}
      {error ? <ErrorState title="Unable to load courses" subtitle={error} /> : null}
      {message ? <p className="mb-4 rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">{message}</p> : null}

      {!loading && !error && user?.role === 'student' ? (
        studentCourses.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {studentCourses.map((course, idx) => (
              <article key={course.id} className="glass soft-shadow animate-rise relative overflow-hidden p-4" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-violet-400/15 blur-2xl" />
                <h3 className="text-lg font-semibold text-cyan-300">{course.name}</h3>
                <p className="mt-2 text-sm text-indigo-200/80">Teacher: {course.teacher_name ?? `#${course.teacher_id}`}</p>
                <p className="text-sm text-indigo-200/80">Group: {course.group_name ?? 'Not assigned'}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.14em] text-indigo-200/55">Course #{course.id}</p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No courses assigned" subtitle="Your account is active, but no course has been linked to your group yet." />
        )
      ) : null}

      {!loading && !error && user?.role === 'teacher' ? (
        courses.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course, idx) => (
              <article key={course.id} className="glass soft-shadow animate-rise relative overflow-hidden p-4" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-violet-400/15 blur-2xl" />
                <h3 className="text-lg font-semibold text-cyan-300">{course.name}</h3>
                <p className="mt-1 text-sm text-indigo-200/80">Teacher: {course.teacher_name}</p>
                <p className="mt-3 text-sm text-indigo-200/80">Groups: {course.group_names.length ? course.group_names.join(', ') : 'No groups linked'}</p>
                <p className="mt-1 text-sm text-indigo-200/80">Students: {course.student_count}</p>
                <p className="mt-1 text-sm text-indigo-200/80">Attendance rate: {course.attendance_rate}%</p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No courses yet" subtitle="Create courses manually or run Moodle synchronization." />
        )
      ) : null}

      {!loading && !error && user?.role === 'admin' ? (
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <form className="glass soft-shadow space-y-4 p-5" onSubmit={handleSubmit}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{editingId ? 'Edit course' : 'Create course'}</h3>
              {editingId ? (
                <button type="button" onClick={resetForm} className="text-sm text-indigo-200/70 transition hover:text-white">
                  Cancel
                </button>
              ) : null}
            </div>
            <label className="block">
              <span className="mb-1 block text-sm text-indigo-200">Course name</span>
              <input value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} className="w-full rounded-2xl border border-indigo-300/25 bg-slate-950/40 px-4 py-3 outline-none" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-indigo-200">Teacher</span>
              <select value={form.teacher_id} onChange={(e) => setForm((c) => ({ ...c, teacher_id: e.target.value }))} className="w-full rounded-2xl border border-indigo-300/25 bg-slate-950/40 px-4 py-3 outline-none">
                <option value="">Select teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} ({teacher.email})
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-indigo-200">Moodle ID</span>
              <input value={form.moodle_id} onChange={(e) => setForm((c) => ({ ...c, moodle_id: e.target.value }))} className="w-full rounded-2xl border border-indigo-300/25 bg-slate-950/40 px-4 py-3 outline-none" />
            </label>
            <button type="submit" disabled={submitting || !form.name.trim() || !form.teacher_id} className="glow w-full rounded-2xl border border-cyan-300/50 bg-cyan-300/10 px-4 py-3 font-medium text-cyan-50 transition hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? 'Saving...' : editingId ? 'Update Course' : 'Create Course'}
            </button>
          </form>

          {adminCourses.length ? (
            <div className="glass soft-shadow overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-indigo-300/20 text-indigo-200">
                  <tr>
                    <th className="p-3">Course</th>
                    <th className="p-3">Teacher</th>
                    <th className="p-3">Moodle</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminCourses.map((course) => (
                    <tr key={course.id} className="border-b border-indigo-300/10">
                      <td className="p-3 font-medium">{course.name}</td>
                      <td className="p-3">{teachers.find((teacher) => teacher.id === course.teacher_id)?.name ?? `#${course.teacher_id}`}</td>
                      <td className="p-3">{course.moodle_id ?? '-'}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => startEdit(course)} className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-xs text-cyan-100">
                            Edit
                          </button>
                          <button type="button" onClick={() => void handleDelete(course.id)} className="rounded-xl border border-rose-300/30 bg-rose-300/10 px-3 py-2 text-xs text-rose-100">
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
            <EmptyState title="No courses yet" subtitle="Create the first course from the form on the left." />
          )}
        </div>
      ) : null}
    </Shell>
  );
}
