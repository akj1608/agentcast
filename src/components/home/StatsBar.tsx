interface StatsBarProps {
  stats: {
    totalSessions: number;
    liveNow: number;
    totalCreators: number;
    totalViews: number;
  };
}

export function StatsBar({ stats }: StatsBarProps) {
  const items = [
    { label: "Sessions", value: stats.totalSessions.toLocaleString() },
    { label: "Live now", value: stats.liveNow.toString(), live: stats.liveNow > 0 },
    { label: "Creators", value: stats.totalCreators.toLocaleString() },
    { label: "Total views", value: formatViews(stats.totalViews) },
  ];

  return (
    <div className="border-y border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {items.map((item, i) => (
            <div
              key={item.label}
              className={`py-5 px-4 text-center ${i > 0 ? "border-l border-[var(--color-border)]" : ""}`}
            >
              <div className="flex items-center justify-center gap-2">
                {item.live && (
                  <span className="h-2 w-2 rounded-full bg-[var(--color-live)] live-dot" />
                )}
                <span
                  className="text-2xl font-bold tabular-nums"
                  style={{ fontFamily: "var(--font-outfit)" }}
                >
                  {item.value}
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1 uppercase tracking-wider font-medium">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatViews(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}
