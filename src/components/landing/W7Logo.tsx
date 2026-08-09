export function W7Logo({ className, showTagline = false }: { className?: string; showTagline?: boolean }) {
  return (
    <span className={`inline-flex items-center ${className ?? ""}`}>
      <div className="flex flex-col">
        <span className="inline-flex items-end leading-none">
          <span className="bg-[linear-gradient(135deg,#ecffc2_0%,#cfff72_18%,#a6ff00_42%,#73dd00_72%,#d7ff9a_100%)] bg-clip-text pr-[0.04em] text-[1.45rem] font-black tracking-[-0.08em] text-transparent drop-shadow-[0_12px_34px_rgba(134,255,0,0.22)] sm:text-[1.7rem]">
            W7
          </span>
          <span className="ml-0.5 pb-0.5 text-[0.54rem] font-bold uppercase tracking-[0.04em] text-white/96 sm:text-[0.62rem]">
            Call
          </span>
        </span>
        {showTagline && (
          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground/80">
            Plataforma SaaS
          </span>
        )}
      </div>
    </span>
  );
}

