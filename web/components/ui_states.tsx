export function LoadingSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="glass soft-shadow animate-pulse p-4">
      <div className="mb-3 h-5 w-36 rounded bg-indigo-300/20" />
      <div className="space-y-2">
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} className="h-4 rounded bg-indigo-300/15" />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="glass soft-shadow flex min-h-44 flex-col items-center justify-center gap-2 p-6 text-center">
      <div className="rounded-full border border-cyan-300/35 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">No data</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="max-w-md text-sm text-indigo-200/70">{subtitle}</p>
    </div>
  );
}

export function ErrorState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="glass soft-shadow flex min-h-44 flex-col items-center justify-center gap-2 border-rose-300/35 p-6 text-center">
      <div className="rounded-full border border-rose-300/50 bg-rose-300/10 px-3 py-1 text-xs text-rose-200">Error</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="max-w-md text-sm text-indigo-200/70">{subtitle}</p>
    </div>
  );
}
