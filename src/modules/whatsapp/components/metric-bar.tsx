interface MetricBarProps {
  label: string;
  current: number;
  total: number;
  suffix?: string;
}

export function MetricBar({ label, current, total, suffix = "" }: MetricBarProps) {
  const progress = total === 0 ? 0 : Math.min(100, (current / total) * 100);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>
          {current}
          {suffix}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[image:var(--gradient-brand)] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
