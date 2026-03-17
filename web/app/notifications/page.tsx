'use client';

import { useEffect, useState } from 'react';

import { Shell } from '../../components/shell';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../components/ui_states';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import type { Notification } from '../../lib/types';

export default function NotificationsPage() {
  const { accessToken, user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || user?.role !== 'student') {
      setLoading(false);
      return;
    }

    api
      .getStudentNotifications(accessToken)
      .then(setNotifications)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load notifications'))
      .finally(() => setLoading(false));
  }, [accessToken, user]);

  return (
    <Shell title="Notifications" description="Updates from homework publishing, attendance workflow, and future Telegram-linked events.">
      {user?.role !== 'student' ? <ErrorState title="Student section only" subtitle="Notifications are shown here only for student accounts." /> : null}
      {user?.role === 'student' && loading ? <LoadingSkeleton lines={8} /> : null}
      {user?.role === 'student' && error ? <ErrorState title="Unable to load notifications" subtitle={error} /> : null}
      {user?.role === 'student' && !loading && !error ? (
        notifications.length ? (
          <div className="space-y-3">
            {notifications.map((item, idx) => (
              <article key={item.id} className="glass soft-shadow animate-rise p-5" style={{ animationDelay: `${idx * 35}ms` }}>
                <div className="flex items-start justify-between gap-4">
                  <p className="text-base text-white">{item.message}</p>
                  <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2 py-1 text-xs text-cyan-100">Update</span>
                </div>
                <p className="mt-3 text-xs text-indigo-200/60">{new Date(item.created_at).toLocaleString()}</p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No notifications yet" subtitle="Homework and attendance updates will appear here once your teachers start publishing them." />
        )
      ) : null}
    </Shell>
  );
}
