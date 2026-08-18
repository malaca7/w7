import { Sparkles, ThumbsUp, ThumbsDown, Copy, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AISuggestionCardProps {
  suggestion: string | null;
  sentiment?: string | null;
  intent?: string | null;
  confidence?: number | null;
  isLoading?: boolean;
  onAccept?: () => void;
  onCopy?: () => void;
  onReject?: () => void;
  onRefresh?: () => void;
}

export function AISuggestionCard({
  suggestion,
  sentiment,
  intent,
  confidence,
  isLoading,
  onAccept,
  onCopy,
  onReject,
  onRefresh,
}: AISuggestionCardProps) {
  if (!suggestion && !isLoading) return null;

  const sentimentConfig: Record<string, { label: string; color: string }> = {
    positivo: { label: "Positivo", color: "text-green-400" },
    neutro: { label: "Neutro", color: "text-muted-foreground" },
    negativo: { label: "Negativo", color: "text-red-400" },
  };

  return (
    <div className="mx-4 mb-2 rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-lg bg-primary/15 flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-xs font-semibold text-primary">Sugestão Gemini</span>
        {confidence != null && (
          <span className="text-[10px] text-muted-foreground ml-auto">
            {Math.round(confidence * 100)}% confiança
          </span>
        )}
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="h-4 w-4 text-primary animate-spin" />
          <span className="text-xs text-muted-foreground">Analisando conversa...</span>
        </div>
      ) : (
        <>
          {/* Suggestion text */}
          <p className="text-xs leading-relaxed text-foreground/90">{suggestion}</p>

          {/* Metadata */}
          {(sentiment || intent) && (
            <div className="flex items-center gap-3 pt-1">
              {sentiment && (
                <span className={cn("text-[10px] font-medium", sentimentConfig[sentiment]?.color)}>
                  Sentimento: {sentimentConfig[sentiment]?.label ?? sentiment}
                </span>
              )}
              {intent && (
                <span className="text-[10px] text-muted-foreground">
                  Intenção: {intent}
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1.5 pt-1">
            <Button size="sm" className="h-6 text-[10px] gap-1 px-2.5" onClick={onAccept}>
              <Send className="h-3 w-3" /> Usar
            </Button>
            <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 px-2.5" onClick={onCopy}>
              <Copy className="h-3 w-3" /> Copiar
            </Button>
            <div className="flex items-center gap-0.5 ml-auto">
              <button onClick={onAccept} className="h-6 w-6 rounded flex items-center justify-center hover:bg-accent" title="Útil">
                <ThumbsUp className="h-3 w-3 text-muted-foreground" />
              </button>
              <button onClick={onReject} className="h-6 w-6 rounded flex items-center justify-center hover:bg-accent" title="Não útil">
                <ThumbsDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
