interface HeatmapCell {
  id: string;
  level: number;
}

export function AttendanceHeatmap({ cells }: { cells: HeatmapCell[] }) {
  return (
    <div className="glass soft-shadow animate-rise p-4" style={{ animationDelay: '70ms' }}>
      <div className="mb-3 flex items-end justify-between">
        <h3 className="text-sm uppercase tracking-[0.15em] text-indigo-200/85">Attendance Heatmap</h3>
        <span className="text-xs text-indigo-200/70">Last 12 weeks</span>
      </div>
      <div className="grid grid-cols-14 gap-1.5">
        {cells.map((cell) => {
          const alpha = 0.12 + cell.level / 120;
          return (
            <span
              key={cell.id}
              className="h-4 w-4 rounded-md transition-transform duration-200 hover:scale-125"
              style={{ background: `rgba(103,232,249,${alpha})` }}
            />
          );
        })}
      </div>
    </div>
  );
}
