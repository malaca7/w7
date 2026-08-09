import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { QrCode, RefreshCcw } from "lucide-react";

interface QrCodeDisplayProps {
  data: string;
  onRefresh?: () => void;
}

/**
 * Renders a visual QR-code-like pattern from a seed string.
 * This is a deterministic visual representation — not a scannable QR code.
 * The pattern uses a seeded hash to create a consistent grid.
 */
export function QrCodeDisplay({ data, onRefresh }: QrCodeDisplayProps) {
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    setTimeLeft(60);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onRefresh?.();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [data, onRefresh]);

  const grid = useMemo(() => {
    const size = 21;
    const modules: boolean[][] = [];

    // Simple hash-based pattern for visual representation
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = (hash * 31 + data.charCodeAt(i)) | 0;
    }

    for (let row = 0; row < size; row++) {
      modules[row] = [];
      for (let col = 0; col < size; col++) {
        // Finder patterns (top-left, top-right, bottom-left)
        const isFinderTL =
          row < 7 && col < 7 &&
          ((row === 0 || row === 6 || col === 0 || col === 6) ||
           (row >= 2 && row <= 4 && col >= 2 && col <= 4));
        const isFinderTR =
          row < 7 && col >= size - 7 &&
          ((row === 0 || row === 6 || col === size - 1 || col === size - 7) ||
           (row >= 2 && row <= 4 && col >= size - 5 && col <= size - 3));
        const isFinderBL =
          row >= size - 7 && col < 7 &&
          ((row === size - 1 || row === size - 7 || col === 0 || col === 6) ||
           (row >= size - 5 && row <= size - 3 && col >= 2 && col <= 4));

        if (isFinderTL || isFinderTR || isFinderBL) {
          modules[row][col] = true;
        } else {
          // Deterministic pseudo-random pattern from seed
          const seed = (hash ^ (row * 1337 + col * 7919)) >>> 0;
          modules[row][col] = seed % 3 !== 0;
        }
      }
    }

    return modules;
  }, [data]);

  const cellSize = 8;
  const padding = 16;
  const totalSize = 21 * cellSize + padding * 2;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, type: "spring" }}
      className="relative flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-4"
    >
      {/* Pulsing glow */}
      <div className="absolute inset-0 rounded-xl bg-primary/5 animate-pulse" />

      <div className="relative flex items-center gap-2 text-xs text-muted-foreground">
        <QrCode className="h-3.5 w-3.5 text-primary" />
        <span>Escaneie com WhatsApp</span>
      </div>

      {/* QR SVG */}
      <div className="relative rounded-lg bg-white p-2">
        <svg
          width={totalSize}
          height={totalSize}
          viewBox={`0 0 ${totalSize} ${totalSize}`}
          className="block"
        >
          <defs>
            <linearGradient id="qr-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a1a1a" />
              <stop offset="50%" stopColor="#2d4a0a" />
              <stop offset="100%" stopColor="#1a1a1a" />
            </linearGradient>
          </defs>
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) =>
              cell ? (
                <rect
                  key={`${rowIndex}-${colIndex}`}
                  x={padding + colIndex * cellSize}
                  y={padding + rowIndex * cellSize}
                  width={cellSize - 1}
                  height={cellSize - 1}
                  rx={1.5}
                  fill="url(#qr-gradient)"
                />
              ) : null,
            ),
          )}
        </svg>

        {/* W7 logo in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white shadow-sm">
            <span className="text-xs font-bold text-gradient">W7</span>
          </div>
        </div>
      </div>

      {/* Timer & Refresh */}
      <div className="relative flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div
            className="h-1.5 rounded-full bg-primary/40 transition-all duration-1000"
            style={{ width: `${(timeLeft / 60) * 80}px` }}
          />
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {timeLeft}s
          </span>
        </div>
        {onRefresh ? (
          <button
            onClick={onRefresh}
            className="text-muted-foreground transition hover:text-primary"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </motion.div>
  );
}
