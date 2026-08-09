import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { getSupabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import {
  MessageSquare, Users, Smartphone, TrendingUp, TrendingDown,
  Clock, CheckCircle2, AlertCircle, ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/")({
  component: DashboardPage,
});

function useStats(companyId: string | undefined) {
  return useQuery({
    queryKey: ["dashboard-stats", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const sb = getSupabase();
      if (!sb || !companyId) return null;

      const [convRes, contactRes, openRes, pendRes] = await Promise.all([
        sb.from("conversations").select("id", { count: "exact", head: true }).eq("company_id", companyId),
        sb.from("contacts").select("id", { count: "exact", head: true }).eq("company_id", companyId),
        sb.from("conversations").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "open"),
        sb.from("conversations").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "pending"),
      ]);

      return {
        conversations: convRes.count ?? 0,
        contacts: contactRes.count ?? 0,
        open: openRes.count ?? 0,
        pending: pendRes.count ?? 0,
      };
    },
    refetchInterval: 60_000,
  });
}

function useRecentConversations(companyId: string | undefined) {
  return useQuery({
    queryKey: ["recent-conversations", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const sb = getSupabase();
      if (!sb || !companyId) return [];
      const { data } = await sb
        .from("conversations")
        .select("id, status, channel, last_message, last_message_at, unread_count, contacts(name, avatar_url)")
        .eq("company_id", companyId)
        .order("last_message_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
  description?: string;
  accent?: string;
}

function StatCard({ title, value, icon: Icon, trend, description, accent = "text-primary" }: StatCardProps) {
  return (
    <Card className="bg-card border-border/50 hover:border-border transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          <div className={cn("p-2.5 rounded-xl bg-primary/10", accent)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {trend != null && (
          <div className="mt-3 flex items-center gap-1 text-xs">
            {trend >= 0
              ? <TrendingUp className="h-3 w-3 text-primary" />
              : <TrendingDown className="h-3 w-3 text-destructive" />}
            <span className={trend >= 0 ? "text-primary" : "text-destructive"}>
              {Math.abs(trend)}%
            </span>
            <span className="text-muted-foreground">vs. mês passado</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  open: { label: "Aberta", color: "text-primary bg-primary/10", icon: MessageSquare },
  pending: { label: "Pendente", color: "text-yellow-500 bg-yellow-500/10", icon: Clock },
  resolved: { label: "Resolvida", color: "text-green-500 bg-green-500/10", icon: CheckCircle2 },
  archived: { label: "Arquivada", color: "text-muted-foreground bg-muted/40", icon: AlertCircle },
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

function DashboardPage() {
  const { authUser } = useAuth();
  const companyId = authUser?.company.id;
  const { data: stats } = useStats(companyId);
  const { data: conversations = [] } = useRecentConversations(companyId);

  const plan = authUser?.company.plan ?? "trial";
  const trialEnd = authUser?.company.trial_ends_at;
  const trialDays = trialEnd
    ? Math.max(0, Math.ceil((new Date(trialEnd).getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Olá, {authUser?.profile.full_name?.split(" ")[0] ?? "Usuário"} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {authUser?.company.name} · Aqui está o resumo de hoje
          </p>
        </div>
        {plan === "trial" && trialDays <= 14 && (
          <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-xl px-4 py-2.5">
            <div>
              <p className="text-xs font-semibold text-primary">Trial expira em {trialDays} dias</p>
              <p className="text-[10px] text-muted-foreground">Faça upgrade para continuar</p>
            </div>
            <Link to="/app/assinatura">
              <Button size="sm" className="h-7 text-xs">Fazer upgrade</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Conversas abertas"
          value={stats?.open ?? "—"}
          icon={MessageSquare}
          trend={12}
        />
        <StatCard
          title="Pendentes"
          value={stats?.pending ?? "—"}
          icon={Clock}
          accent="text-yellow-500"
        />
        <StatCard
          title="Contatos"
          value={stats?.contacts ?? "—"}
          icon={Users}
          trend={5}
          accent="text-blue-400"
        />
        <StatCard
          title="Total conversas"
          value={stats?.conversations ?? "—"}
          icon={Smartphone}
          accent="text-purple-400"
        />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent conversations */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold">Conversas recentes</CardTitle>
              <Link to="/app/conversas">
                <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
                  Ver todas <ArrowUpRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhuma conversa ainda</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Conecte um WhatsApp para começar</p>
                  <Link to="/app/whatsapp" className="mt-4">
                    <Button size="sm">Conectar WhatsApp</Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {conversations.map((conv: any) => {
                    const s = statusConfig[conv.status] ?? statusConfig.open;
                    return (
                      <Link
                        key={conv.id}
                        to="/app/atendimento"
                        className="flex items-center gap-3 px-5 py-3 hover:bg-accent/50 transition-colors"
                      >
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                          {conv.contacts?.name?.[0] ?? "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">
                              {conv.contacts?.name ?? "Contato desconhecido"}
                            </p>
                            {conv.unread_count > 0 && (
                              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                {conv.unread_count}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {conv.last_message ?? "Sem mensagens"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", s.color)}>
                            {s.label}
                          </span>
                          {conv.last_message_at && (
                            <span className="text-[10px] text-muted-foreground">
                              {timeAgo(conv.last_message_at)}
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick actions + plan info */}
        <div className="space-y-4">
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Ações rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "Nova conversa", to: "/app/atendimento", icon: MessageSquare },
                { label: "Adicionar contato", to: "/app/clientes", icon: Users },
                { label: "Nova campanha", to: "/app/campanhas", icon: "📣" },
                { label: "Conectar WhatsApp", to: "/app/whatsapp", icon: Smartphone },
              ].map((action) => (
                <Link key={action.to} to={action.to}>
                  <Button variant="outline" className="w-full justify-start gap-3 h-9 text-sm font-normal border-border/50 hover:border-primary/30 hover:bg-primary/5">
                    {typeof action.icon === "string" ? (
                      <span>{action.icon}</span>
                    ) : (
                      <action.icon className="h-4 w-4 text-muted-foreground" />
                    )}
                    {action.label}
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Plano atual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <Badge className="capitalize bg-primary/15 text-primary border-primary/20 hover:bg-primary/20">
                  {plan}
                </Badge>
                {plan !== "enterprise" && (
                  <Link to="/app/assinatura">
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                      Upgrade <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  </Link>
                )}
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Conexões WhatsApp</span>
                  <span className="text-foreground font-medium">1 / 3</span>
                </div>
                <div className="flex justify-between">
                  <span>Atendentes</span>
                  <span className="text-foreground font-medium">2 / 5</span>
                </div>
                <div className="flex justify-between">
                  <span>Mensagens/mês</span>
                  <span className="text-foreground font-medium">1.2k / 5k</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
