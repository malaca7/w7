export function W7Logo({ className, showTagline = false }: { className?: string; showTagline?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <span
        aria-hidden
        className="relative grid size-9 place-items-center rounded-xl p-[1.5px] shadow-[0_0_20px_-4px_rgba(166,255,0,0.45)] transition-transform duration-300 hover:scale-105"
        style={{
          background: "linear-gradient(135deg, #A6FF00 0%, #4E9F3D 50%, #2D5A27 100%)",
        }}
      >
        <span className="flex size-full items-center justify-center rounded-[10px] bg-[#0A0C10] font-black text-xs text-gradient tracking-tighter">
          W7
        </span>
      </span>
      <div className="flex flex-col">
        <span className="text-xl font-extrabold tracking-tight text-gradient drop-shadow-[0_2px_12px_rgba(166,255,0,0.2)]">
          W7
        </span>
        {showTagline && (
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Plataforma SaaS
          </span>
        )}
      </div>
    </span>
  );
}

