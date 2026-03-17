'use client';

import { useEffect, useMemo, useState } from 'react';

import { Shell } from '../../components/shell';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../components/ui_states';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import type { AttendanceRecord, AttendanceStatus, CourseStudentAttendance, TeacherCourse } from '../../lib/types';

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

export default function AttendancePage() {
  const { accessToken, user } = useAuth();
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [students, setStudents] = useState<CourseStudentAttendance[]>([]);
  const [studentAttendance, setStudentAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayValue);
  const [drafts, setDrafts] = useState<Record<number, AttendanceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !user) {
      return;
    }

    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        if (user.role === 'student') {
          setStudentAttendance(await api.getStudentAttendance(accessToken));
          return;
        }

        const courseList = await api.getTeacherCourses(accessToken);
        setCourses(courseList);
        if (courseList.length) {
          setSelectedCourseId((current) => current ?? courseList[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load attendance');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [accessToken, user]);

  useEffect(() => {
    if (!accessToken || !selectedCourseId || !user || user.role === 'student') {
      return;
    }

    setLoading(true);
    setError(null);
    api
      .getTeacherCourseStudents(accessToken, selectedCourseId, selectedDate)
      .then((rows) => {
        setStudents(rows);
        setDrafts(
          Object.fromEntries(
            rows.map((row) => [row.student_id, row.status ?? 'present']),
          ) as Record<number, AttendanceStatus>,
        );
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load roster'))
      .finally(() => setLoading(false));
  }, [accessToken, selectedCourseId, selectedDate, user]);

  const attendanceSummary = useMemo(() => {
    if (user?.role === 'student') {
      return {
        present: studentAttendance.filter((item) => item.status === 'present').length,
        absent: studentAttendance.filter((item) => item.status === 'absent').length,
        late: studentAttendance.filter((item) => item.status === 'late').length,
      };
    }

    return {
      present: students.filter((item) => drafts[item.student_id] === 'present').length,
      absent: students.filter((item) => drafts[item.student_id] === 'absent').length,
      late: students.filter((item) => drafts[item.student_id] === 'late').length,
    };
  }, [drafts, studentAttendance, students, user]);

  async function saveAttendance() {
    if (!accessToken || !selectedCourseId || !students.length) {
      return;
    }

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      await api.markAttendance(
        accessToken,
        students.map((student) => ({
          student_id: student.student_id,
          course_id: selectedCourseId,
          date: selectedDate,
          status: drafts[student.student_id] ?? 'present',
        })),
      );
      setMessage('Attendance saved successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save attendance');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Shell
      title="Attendance"
      description={user?.role === 'student' ? 'Your attendance history from the shared academic database.' : 'Mark attendance by course and date with live backend persistence.'}
      action={
        user?.role === 'student' ? null : (
          <button
            type="button"
            onClick={saveAttendance}
            disabled={saving || !students.length}
            className="glow rounded-xl border border-cyan-300/50 bg-cyan-300/10 px-3 py-2 text-sm text-cyan-100 transition hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Marks'}
          </button>
        )
      }
    >
      {loading ? <LoadingSkeleton lines={8} /> : null}
      {error ? <ErrorState title="Attendance unavailable" subtitle={error} /> : null}
      {message ? <p className="mb-4 rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">{message}</p> : null}

      {!loading && !error && user?.role === 'student' ? (
        studentAttendance.length ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              {[
                ['Present', attendanceSummary.present],
                ['Absent', attendanceSummary.absent],
                ['Late', attendanceSummary.late],
              ].map(([label, value], index) => (
                <article key={label} className="glass soft-shadow animate-rise p-4" style={{ animationDelay: `${index * 50}ms` }}>
                  <p className="text-xs uppercase tracking-[0.15em] text-indigo-200/70">{label}</p>
                  <p className="mt-3 text-3xl font-semibold text-cyan-300">{value}</p>
                </article>
              ))}
            </div>
            <div className="glass soft-shadow overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-indigo-300/20 text-indigo-200">
                  <tr>
                    <th className="p-3">Date</th>
                      <th className="p-3">Course</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {studentAttendance.map((row) => (
                    <tr key={row.id} className="border-b border-indigo-300/10">
                      <td className="p-3">{row.date}</td>
                      <td className="p-3">{row.course_name ?? `Course #${row.course_id}`}</td>
                      <td className="p-3 capitalize">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState title="No attendance records yet" subtitle="Your teacher has not published any attendance entries for your account." />
        )
      ) : null}

      {!loading && !error && user && user.role !== 'student' ? (
        courses.length ? (
          <div className="space-y-4">
            <div className="glass soft-shadow flex flex-col gap-4 p-4 lg:flex-row lg:items-end">
              <label className="block flex-1">
                <span className="mb-1 block text-sm text-indigo-200">Course</span>
                <select
                  value={selectedCourseId ?? ''}
                  onChange={(event) => setSelectedCourseId(Number(event.target.value))}
                  className="w-full rounded-2xl border border-indigo-300/25 bg-slate-950/40 px-4 py-3 outline-none transition focus:border-cyan-300/50"
                >
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block w-full lg:max-w-56">
                <span className="mb-1 block text-sm text-indigo-200">Date</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="w-full rounded-2xl border border-indigo-300/25 bg-slate-950/40 px-4 py-3 outline-none transition focus:border-cyan-300/50"
                />
              </label>
              <div className="grid flex-1 grid-cols-3 gap-3">
                {[
                  ['Present', attendanceSummary.present],
                  ['Absent', attendanceSummary.absent],
                  ['Late', attendanceSummary.late],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-indigo-300/15 bg-slate-950/30 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/60">{label}</p>
                    <p className="mt-2 text-2xl font-semibold text-cyan-300">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {students.length ? (
              <div className="glass soft-shadow overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-indigo-300/20 text-indigo-200">
                    <tr>
                      <th className="p-3">Student</th>
                      <th className="p-3">Group</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.student_id} className="border-b border-indigo-300/10">
                        <td className="p-3 font-medium">{student.student_name}</td>
                        <td className="p-3 text-indigo-100/75">{student.group_name ?? '-'}</td>
                        <td className="p-3">
                          <select
                            value={drafts[student.student_id] ?? 'present'}
                            onChange={(event) =>
                              setDrafts((current) => ({
                                ...current,
                                [student.student_id]: event.target.value as AttendanceStatus,
                              }))
                            }
                            className="rounded-xl border border-indigo-300/25 bg-slate-950/40 px-3 py-2 capitalize outline-none transition focus:border-cyan-300/50"
                          >
                            <option value="present">present</option>
                            <option value="absent">absent</option>
                            <option value="late">late</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No students linked to this course" subtitle="Attach groups and students to the course to start marking attendance." />
            )}
          </div>
        ) : (
          <EmptyState title="No teacher courses found" subtitle="Create a course or link a Moodle import to start using attendance." />
        )
      ) : null}
    </Shell>
  );
}
