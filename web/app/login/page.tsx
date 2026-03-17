'use client';

import { FormEvent, useState } from 'react';

import { useAuth } from '../../lib/auth';

export default function LoginPage() {
  const { login, ready } = useAuth();
  const [role, setRole] = useState<'teacher' | 'student'>('teacher');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      await login({ identifier, password, role });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="grid w-full max-w-6xl gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="glass-strong soft-shadow grid-lines overflow-hidden p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/65">SMART EDU JOURNAL</p>
          <h1 className="mt-4 max-w-xl text-5xl font-semibold leading-tight text-white">
            One website for teachers, admins, students, and the Telegram bot.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-indigo-100/80">
            Unified backend, one database, attendance tracking, homework publishing, Moodle sync, and role-based access.
          </p>
          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {[
              ['Unified API', 'FastAPI backend serves web, mobile, and bot'],
              ['Teacher Workflow', 'Attendance, homework, statistics, reports'],
              ['Shared Database', 'Single source of truth for every channel'],
            ].map(([title, subtitle], index) => (
              <article key={title} className="glass animate-rise p-4" style={{ animationDelay: `${index * 70}ms` }}>
                <p className="text-sm font-semibold text-cyan-300">{title}</p>
                <p className="mt-2 text-sm text-indigo-100/75">{subtitle}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="glass-strong soft-shadow p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-indigo-200/65">Access</p>
          <h2 className="mt-3 text-3xl font-semibold">Sign in with Moodle</h2>
          <p className="mt-2 text-sm text-indigo-100/75">
            Use your Moodle username and password. Students and assistants enter as student, teachers as teacher, and admin access is granted by the server allowlist.
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-950/35 p-1">
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`rounded-xl px-4 py-3 text-sm transition ${role === 'teacher' ? 'bg-cyan-300/15 text-cyan-100' : 'text-indigo-200/75'}`}
              >
                Teacher / Admin
              </button>
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`rounded-xl px-4 py-3 text-sm transition ${role === 'student' ? 'bg-cyan-300/15 text-cyan-100' : 'text-indigo-200/75'}`}
              >
                Student
              </button>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm text-indigo-200">Moodle username</span>
              <input
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                className="w-full rounded-2xl border border-indigo-300/25 bg-slate-950/50 px-4 py-3 outline-none transition focus:border-cyan-300/50"
                placeholder="moodle_username"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm text-indigo-200">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-indigo-300/25 bg-slate-950/50 px-4 py-3 outline-none transition focus:border-cyan-300/50"
                placeholder="Password"
              />
            </label>

            {error ? <p className="rounded-xl border border-rose-300/30 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">{error}</p> : null}
            <p className="text-xs text-indigo-100/60">
              First login creates or updates your account from Moodle. Assistants should sign in as student and only gain edit access after entering a teacher one-time code.
            </p>

            <button
              type="submit"
              disabled={!ready || pending}
              className="glow w-full rounded-2xl border border-cyan-300/50 bg-cyan-300/10 px-4 py-3 font-medium text-cyan-50 transition hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? 'Signing in...' : 'Open workspace'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
