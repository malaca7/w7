import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { getSupabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, MessageSquare, Clock, CheckCircle2, User } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/atendimento")({
  component: AtendimentoPage,
});

const statusOptions = [
  { value: "all", label: "Todos" },
  { value: "open", label: "Abertos" },
  { value: "pending", label: "Pendentes" },
  { value: "resolved", label: "Resolvidos" },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  open: { label: "Aberta", color: "bg-primary/10 text-primary", icon: MessageSquare },
  pending: { label: "Pendente", color: "bg-yellow-500/10 text-yellow-500", icon: Clock },
  resolved: { label: "Resolvida", color: "bg-green-500/10 text-green-500", icon: CheckCircle2 },
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function AtendimentoPage() {
  const { authUser } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations", authUser?.company.id, status],
    enabled: !!authUser?.company.id,
    queryFn: async () => {
      const sb = getSupabase();
      if (!sb) return [];
      let q = sb.from("conversations")
        .select("*, contacts(name, phone, avatar_url)")
        .eq("company_id", authUser!.company.id)
        .order("last_message_at", { ascending: false })
        .limit(50);
      if (status !== "all") q = q.eq("status", status);
      const { data } = await q;
      return data ?? [];
    },
  });

  const filtered = conversations.filter((c: any) =>
    search ? (c.contacts?.name ?? "").toLowerCase().includes(search.toLowerCase()) : true,
  );

  const selectedConv = conversations.find((c: any) => c.id === selected);

  return (
    <div className="flex h-full">
      {/* Left panel */}
      <div className={cn("flex flex-col border-r border-border/50 bg-card/30", selected ? "hidden md:flex md:w-80 lg:w-96" : "flex-1 md:w-80 lg:w-96 md:flex-none")}>
        <div className="p-4 border-b border-border/40 space-y-3">
          <PageHeader title="Atendimento" className="mb-0" />
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar contato…"
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border/40">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 rounded bg-muted" />
                  <div className="h-2.5 w-48 rounded bg-muted" />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            filtered.map((conv: any) => {
              const s = statusConfig[conv.status] ?? statusConfig.open;
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelected(conv.id)}
                  className={cn(
                    "w-full flex items-start gap-3 p-4 text-left hover:bg-accent/50 transition-colors",
                    selected === conv.id && "bg-accent/70",
                  )}
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                    {conv.contacts?.name?.[0] ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 justify-between">
                      <span className="text-sm font-medium truncate">{conv.contacts?.name ?? "Desconhecido"}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {conv.last_message_at ? timeAgo(conv.last_message_at) : ""}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.last_message ?? "Sem mensagens"}</p>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium mt-1.5 inline-block", s.color)}>
                      {s.label}
                    </span>
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {conv.unread_count}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right: chat area */}
      {selected && selectedConv ? (
        <div className="flex-1 flex flex-col">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-border/50">
            <button onClick={() => setSelected(null)} className="md:hidden text-muted-foreground hover:text-foreground mr-1">←</button>
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
              {selectedConv.contacts?.name?.[0] ?? "?"}
            </div>
            <div>
              <p className="text-sm font-semibold">{selectedConv.contacts?.name ?? "Desconhecido"}</p>
              <p className="text-xs text-muted-foreground">{selectedConv.contacts?.phone ?? ""}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                <User className="h-3 w-3" />
                Atribuir
              </Button>
              <Select defaultValue={selectedConv.status}>
                <SelectTrigger className="h-7 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Módulo de mensagens em tempo real</p>
              <p className="text-xs mt-1">Integrado com WhatsApp via webhook</p>
            </div>
          </div>

          {/* Message input */}
          <div className="border-t border-border/50 p-4">
            <div className="flex gap-3">
              <Input placeholder="Digite uma mensagem…" className="flex-1" />
              <Button>Enviar</Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden md:flex items-center justify-center flex-col text-center">
          <MessageSquare className="h-14 w-14 text-muted-foreground/20 mb-4" />
          <p className="text-sm text-muted-foreground">Selecione uma conversa para começar</p>
        </div>
      )}
    </div>
  );
}
