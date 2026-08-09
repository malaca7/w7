interface StatCardProps {
  label: string;
  value: string;
  colorDotClass?: string;
}

export function StatCard({ label, value, colorDotClass }: StatCardProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-2">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 flex items-center gap-2">
        {colorDotClass ? (
          <span className={`h-2.5 w-2.5 rounded-full ${colorDotClass}`} />
        ) : null}
        <p className="text-sm capitalize">{value}</p>
      </div>
    </div>
  );
}
