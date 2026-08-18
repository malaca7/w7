import { useMemo, useRef, useState } from "react";
import { Search, Filter, X, MessageSquare, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/lib/supabase";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading?: boolean;
}

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  open: { label: "Aberta", color: "text-primary bg-primary/10", dot: "bg-primary" },
  pending: { label: "Pendente", color: "text-yellow-500 bg-yellow-500/10", dot: "bg-yellow-500" },
  resolved: { label: "Resolvida", color: "text-green-500 bg-green-500/10", dot: "bg-green-500" },
  archived: { label: "Arquivada", color: "text-muted-foreground bg-muted/40", dot: "bg-muted-foreground" },
};

const priorityDot: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  normal: "bg-transparent",
  low: "bg-transparent",
};

function timeAgo(date: string | null) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}sem`;
}

export function ConversationList({ conversations, selectedId, onSelect, isLoading }: ConversationListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    let list = conversations;
    if (statusFilter !== "all") {
      list = list.filter((c) => c.status === statusFilter);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((c) =>
        (c.contacts?.name ?? "").toLowerCase().includes(s) ||
        (c.contacts?.phone ?? "").includes(s) ||
        (c.last_message ?? "").toLowerCase().includes(s)
      );
    }
    return list;
  }, [conversations, search, statusFilter]);

  const counts = useMemo(() => ({
    open: conversations.filter((c) => c.status === "open").length,
    pending: conversations.filter((c) => c.status === "pending").length,
  }), [conversations]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 space-y-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Conversas</h2>
          <div className="flex items-center gap-1.5">
            {counts.open > 0 && (
              <Badge variant="outline" className="h-5 text-[10px] bg-primary/10 text-primary border-primary/20">
                {counts.open} abertas
              </Badge>
            )}
            {counts.pending > 0 && (
              <Badge variant="outline" className="h-5 text-[10px] bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                {counts.pending}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar conversa…"
              className="pl-8 h-8 text-sm bg-accent/40 border-border/30"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-28 text-xs bg-accent/40 border-border/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="open">Abertas</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="resolved">Resolvidas</SelectItem>
              <SelectItem value="archived">Arquivadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="divide-y divide-border/30">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
                <div className="h-11 w-11 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 rounded bg-muted" />
                  <div className="h-2.5 w-48 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <MessageSquare className="h-10 w-10 text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">
              {search ? "Nenhuma conversa encontrada" : "Nenhuma conversa ainda"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filtered.map((conv) => {
              const s = statusConfig[conv.status] ?? statusConfig.open;
              const pDot = priorityDot[conv.priority ?? "normal"];
              const isSelected = selectedId === conv.id;
              const hasUnread = conv.unread_count > 0;

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv.id)}
                  className={cn(
                    "w-full flex items-start gap-3 px-4 py-3.5 text-left transition-all duration-150",
                    "hover:bg-accent/40",
                    isSelected && "bg-primary/5 border-l-2 border-l-primary",
                    !isSelected && "border-l-2 border-l-transparent",
                  )}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className={cn(
                      "h-11 w-11 rounded-full flex items-center justify-center text-sm font-bold",
                      isSelected ? "bg-primary/20 text-primary" : "bg-accent text-muted-foreground",
                    )}>
                      {conv.contacts?.avatar_url ? (
                        <img src={conv.contacts.avatar_url} className="h-full w-full rounded-full object-cover" alt="" />
                      ) : (
                        conv.contacts?.name?.[0]?.toUpperCase() ?? "?"
                      )}
                    </div>
                    {pDot !== "bg-transparent" && (
                      <span className={cn("absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background", pDot)} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("text-sm font-medium truncate", hasUnread && "text-foreground font-semibold")}>
                        {conv.contacts?.name ?? "Desconhecido"}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {timeAgo(conv.last_message_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={cn(
                        "text-xs truncate",
                        hasUnread ? "text-foreground/80 font-medium" : "text-muted-foreground",
                      )}>
                        {conv.last_message ?? "Sem mensagens"}
                      </p>
                      {hasUnread && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1 shrink-0">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", s.color)}>
                        {s.label}
                      </span>
                      {conv.departments && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-accent text-muted-foreground">
                          {conv.departments.name}
                        </span>
                      )}
                      {conv.ai_sentiment && (
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                          conv.ai_sentiment === "positivo" ? "bg-green-500/10 text-green-400" :
                          conv.ai_sentiment === "negativo" ? "bg-red-500/10 text-red-400" :
                          "bg-accent text-muted-foreground"
                        )}>
                          {conv.ai_sentiment === "positivo" ? "😊" : conv.ai_sentiment === "negativo" ? "😠" : "😐"}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
