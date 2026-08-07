export function W7Logo({ className }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className ?? ""}`}>
      <span
        aria-hidden
        className="grid size-8 place-items-center rounded-xl font-bold text-primary-foreground"
        style={{ backgroundImage: "var(--gradient-brand)" }}
      >
        W
      </span>
      <span className="text-lg font-semibold tracking-tight">W7</span>
    </span>
  );
}
