'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth';

type Role = 'admin' | 'teacher' | 'student';

const itemsByRole: Record<Role, Array<[string, string]>> = {
  admin: [
    ['Dashboard', '/dashboard'],
    ['Users', '/users'],
    ['Groups', '/groups'],
    ['Courses', '/courses'],
    ['Moodle', '/moodle'],
    ['Attendance', '/attendance'],
    ['Homework', '/homework'],
    ['Settings', '/settings'],
  ],
  teacher: [
    ['Dashboard', '/dashboard'],
    ['Courses', '/courses'],
    ['Assistants', '/assistants'],
    ['Reviews', '/reviews'],
    ['Attendance', '/attendance'],
    ['Homework', '/homework'],
    ['Settings', '/settings'],
  ],
  student: [
    ['Profile', '/profile'],
    ['Dashboard', '/dashboard'],
    ['Courses', '/courses'],
    ['Reviews', '/reviews'],
    ['Attendance', '/attendance'],
    ['Homework', '/homework'],
    ['Notifications', '/notifications'],
    ['Settings', '/settings'],
  ],
};

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  const items = itemsByRole[user.role as Role];

  return (
    <aside className="glass sticky top-4 h-[calc(100vh-2rem)] w-[270px] overflow-hidden p-6 flex flex-col">
      <div className="mb-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--red-primary)]">Academic OS</p>
        <h1 className="mt-2 text-lg font-bold text-white">SMART EDU JOURNAL</h1>
        <div className="mt-4 p-3 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)]">
          <p className="text-sm font-semibold text-white">{user.name}</p>
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">{user.role}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto pr-2">
        {items.map(([label, href]) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition duration-200 ${
                active
                  ? 'bg-[var(--red-primary)] text-white shadow-lg shadow-[var(--red-primary)]/20'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-panel)] hover:text-white'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
        <button
          type="button"
          onClick={logout}
          className="w-full rounded-lg px-3 py-2 text-sm text-[var(--text-muted)] hover:text-white transition"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
};
