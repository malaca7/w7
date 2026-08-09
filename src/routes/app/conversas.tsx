import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { getSupabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MessagesSquare, Clock, CheckCircle2, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/app/conversas")({
  component: ConversasPage,
});

const statusOptions = [
  { value: "all", label: "Todos os status" },
  { value: "open", label: "Abertas" },
  { value: "pending", label: "Pendentes" },
  { value: "resolved", label: "Resolvidas" },
  { value: "archived", label: "Arquivadas" },
];

const channelOptions = [
  { value: "all", label: "Todos os canais" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "E-mail" },
  { value: "chat", label: "Chat" },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: "Aberta", color: "bg-primary/10 text-primary" },
  pending: { label: "Pendente", color: "bg-yellow-500/10 text-yellow-500" },
  resolved: { label: "Resolvida", color: "bg-green-500/10 text-green-500" },
  archived: { label: "Arquivada", color: "bg-muted text-muted-foreground" },
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

function ConversasPage() {
  const { authUser } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [channel, setChannel] = useState("all");

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations-list", authUser?.company.id, status, channel],
    enabled: !!authUser?.company.id,
    queryFn: async () => {
      const sb = getSupabase();
      if (!sb) return [];
      let q = sb.from("conversations")
        .select("*, contacts(name, phone)")
        .eq("company_id", authUser!.company.id)
        .order("last_message_at", { ascending: false })
        .limit(100);
      if (status !== "all") q = q.eq("status", status);
      if (channel !== "all") q = q.eq("channel", channel);
      const { data } = await q;
      return data ?? [];
    },
  });

  const filtered = conversations.filter((c: any) =>
    search ? (c.contacts?.name ?? "").toLowerCase().includes(search.toLowerCase()) : true,
  );

  const counts = {
    open: conversations.filter((c: any) => c.status === "open").length,
    pending: conversations.filter((c: any) => c.status === "pending").length,
    resolved: conversations.filter((c: any) => c.status === "resolved").length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Conversas"
        description="Histórico completo de conversas"
        actions={
          <Link to="/app/atendimento">
            <Button size="sm">Ir para atendimento</Button>
          </Link>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Abertas", value: counts.open, icon: MessagesSquare, color: "text-primary" },
          { label: "Pendentes", value: counts.pending, icon: Clock, color: "text-yellow-500" },
          { label: "Resolvidas", value: counts.resolved, icon: CheckCircle2, color: "text-green-500" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border/50 bg-card p-4 flex items-center gap-3">
            <s.icon className={cn("h-5 w-5", s.color)} />
            <div>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar contato…" className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={channel} onValueChange={setChannel}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {channelOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="rounded-xl border border-border/50 overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border/40">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-40 rounded bg-muted" />
                  <div className="h-2.5 w-64 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessagesSquare className="h-12 w-12 text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma conversa encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filtered.map((conv: any) => {
              const s = statusConfig[conv.status] ?? statusConfig.open;
              return (
                <Link
                  key={conv.id}
                  to="/app/atendimento"
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-accent/50 transition-colors"
                >
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                    {conv.contacts?.name?.[0] ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{conv.contacts?.name ?? "Desconhecido"}</p>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", s.color)}>
                        {s.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.last_message ?? "—"}</p>
                  </div>
                  <div className="text-[11px] text-muted-foreground shrink-0">
                    {conv.last_message_at ? timeAgo(conv.last_message_at) : ""}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
