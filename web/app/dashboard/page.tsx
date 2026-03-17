'use client';

import React, { useEffect, useState } from 'react';
import { AttendanceChart } from '../../components/attendance_chart';
import { AttendanceHeatmap } from '../../components/heatmap';
import { Metrics } from '../../components/metrics';
import { Shell } from '../../components/shell';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../components/ui_states';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import type { CourseAttendanceStat, DashboardSummary, Notification, StudentProfile, TeacherCourse } from '../../lib/types';

export default function DashboardPage() {
  const { accessToken, user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [stats, setStats] = useState<CourseAttendanceStat[]>([]);
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !user) {
      return;
    }

    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        if (user.role === 'student') {
          const [profile, studentNotifications] = await Promise.all([
            api.getStudentProfile(accessToken), 
            api.getStudentNotifications(accessToken)
          ]);
          setSummary({
            courses_count: profile.courses_count,
            students_count: 1,
            homework_count: profile.homework_count,
            attendance_rate_today: profile.attendance_percent,
          });
          setStudentProfile(profile);
          setNotifications(studentNotifications);
          setStats([]);
          setCourses([]);
          return;
        }

        const [teacherSummary, teacherStats, teacherCourses] = await Promise.all([
          api.getTeacherDashboard(accessToken),
          api.getTeacherStatistics(accessToken),
          api.getTeacherCourses(accessToken),
        ]);
        setSummary(teacherSummary);
        setStats(teacherStats);
        setCourses(teacherCourses);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [accessToken, user]);

  const metricItems = summary
    ? [
        { label: user?.role === 'student' ? 'Мои курсы' : 'Курсы', value: String(summary.courses_count), hint: 'Связанные с вашим рабочим пространством' },
        { label: user?.role === 'student' ? 'Мой профиль' : 'Студенты', value: String(summary.students_count), hint: 'Активные записи' },
        { label: 'Домашние задания', value: String(summary.homework_count), hint: 'Опубликованные задания' },
        { label: 'Посещаемость', value: `${summary.attendance_rate_today}%`, hint: 'Текущий показатель' },
      ]
    : [];

  const chartData = stats.map((item) => ({
    name: item.course_name,
    rate: item.present_percent,
  }));

  const heatmapCells = Array.from({ length: 84 }, (_, index) => ({
    id: `cell-${index}`,
    level: stats.length ? Number(stats[index % stats.length]?.present_percent ?? 0) : ((index * 17) % 100),
  }));

  return (
    <Shell
      title="Дашборд"
      description={user?.role === 'student' ? 'Обзор ваших курсов, заданий и посещаемости.' : 'Оперативный обзор посещаемости, заданий и академической активности.'}
    >
      {loading ? <LoadingSkeleton lines={10} /> : null}
      {error ? <ErrorState title="Ошибка загрузки" subtitle={error} /> : null}

      {!loading && !error && summary ? (
        <div className="space-y-6">
          <Metrics items={metricItems} />
          
          <div className="grid gap-6 xl:grid-cols-2">
            {user?.role === 'student' ? (
              <div className="glass p-6 animate-rise">
                <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-white">Уведомления</h3>
                {studentProfile ? (
                  <div className="mt-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-4">
                    <p className="text-xs text-[var(--text-muted)]">Группа</p>
                    <p className="mt-1 text-lg font-semibold text-white">{studentProfile.group_name ?? 'Не назначена'}</p>
                    <p className="mt-4 text-xs text-[var(--text-muted)]">Telegram</p>
                    <p className="mt-1 text-sm text-white">{studentProfile.telegram_id ?? 'Не привязан'}</p>
                  </div>
                ) : null}
                {notifications.length ? (
                  <div className="mt-6 space-y-3">
                    {notifications.slice(0, 6).map((item) => (
                      <article key={item.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-4">
                        <p className="text-sm text-white">{item.message}</p>
                        <p className="mt-2 text-xs text-[var(--text-muted)]">{new Date(item.created_at).toLocaleString()}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="Нет уведомлений" subtitle="Обновления от преподавателей появятся здесь." />
                )}
              </div>
            ) : (
              <>
                <AttendanceChart data={chartData} />
                <AttendanceHeatmap cells={heatmapCells} />
              </>
            )}
          </div>

          {!user || user.role === 'student' ? null : (
            <div className="glass p-6 animate-rise" style={{ animationDelay: '120ms' }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-white">Курсы</h3>
                <span className="text-xs text-[var(--text-muted)]">{courses.length} активных</span>
              </div>
              {courses.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {courses.map((course) => (
                    <article key={course.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-4 transition hover:border-[var(--red-primary)]">
                      <p className="text-lg font-semibold text-white">{course.name}</p>
                      <p className="mt-2 text-sm text-[var(--text-muted)]">Преподаватель: {course.teacher_name}</p>
                      <p className="mt-4 text-sm text-[var(--text-muted)]">Студентов: {course.student_count}</p>
                      <p className="text-sm text-[var(--text-muted)]">Посещаемость: <span className="text-[var(--red-primary)] font-bold">{course.attendance_rate}%</span></p>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState title="Курсы не найдены" subtitle="Создайте курсы или выполните синхронизацию." />
              )}
            </div>
          )}
        </div>
      ) : null}
    </Shell>
  );
}
