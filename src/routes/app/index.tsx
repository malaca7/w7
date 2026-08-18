import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import {
  MessageSquare, Users, Smartphone, TrendingUp,
  Clock, CheckCircle2, ArrowUpRight, Send, Inbox,
  Sparkles, Wifi, UserCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { fetchDashboardStats, fetchConversations, fetchConnections } from "@/lib/whatsapp-db";
import { fetchAIUsageStats } from "@/lib/gemini";

export const Route = createFileRoute("/app/")({
  component: DashboardPage,
});

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
    <Card className="bg-card border-border/50 hover:border-border/80 transition-all duration-200 group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {description && <p className="text-[10px] text-muted-foreground">{description}</p>}
          </div>
          <div className={cn("p-2.5 rounded-xl bg-primary/5 group-hover:bg-primary/10 transition-colors", accent)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {trend != null && (
          <div className="mt-3 flex items-center gap-1 text-xs">
            <TrendingUp className={cn("h-3 w-3", trend >= 0 ? "text-primary" : "text-destructive")} />
            <span className={trend >= 0 ? "text-primary" : "text-destructive"}>
              {Math.abs(trend)}%
            </span>
            <span className="text-muted-foreground">vs. semana passada</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function timeAgo(date: string | null) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: "Aberta", color: "text-primary bg-primary/10" },
  pending: { label: "Pendente", color: "text-yellow-500 bg-yellow-500/10" },
  resolved: { label: "Resolvida", color: "text-green-500 bg-green-500/10" },
  archived: { label: "Arquivada", color: "text-muted-foreground bg-muted/40" },
};

function DashboardPage() {
  const { authUser } = useAuth();
  const companyId = authUser?.company.id;

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", companyId],
    enabled: !!companyId,
    queryFn: () => fetchDashboardStats(companyId!),
    refetchInterval: 30_000,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["dashboard-convs", companyId],
    enabled: !!companyId,
    queryFn: () => fetchConversations(companyId!, { limit: 8 }),
  });

  const { data: connections = [] } = useQuery({
    queryKey: ["connections", companyId],
    enabled: !!companyId,
    queryFn: () => fetchConnections(companyId!),
  });

  const { data: aiStats } = useQuery({
    queryKey: ["ai-usage-stats", companyId],
    enabled: !!companyId,
    queryFn: () => fetchAIUsageStats(companyId!),
  });

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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Conversas abertas"
          value={stats?.open ?? "—"}
          icon={Inbox}
        />
        <StatCard
          title="Pendentes"
          value={stats?.pending ?? "—"}
          icon={Clock}
          accent="text-yellow-500"
        />
        <StatCard
          title="Resolvidas"
          value={stats?.resolved ?? "—"}
          icon={CheckCircle2}
          accent="text-green-500"
        />
        <StatCard
          title="Contatos"
          value={stats?.contacts ?? "—"}
          icon={Users}
          accent="text-blue-400"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Msgs enviadas hoje"
          value={stats?.sentToday ?? 0}
          icon={Send}
          accent="text-emerald-400"
        />
        <StatCard
          title="Msgs recebidas hoje"
          value={stats?.receivedToday ?? 0}
          icon={MessageSquare}
          accent="text-violet-400"
        />
        <StatCard
          title="Atendentes online"
          value={stats?.onlineAgents ?? 0}
          icon={UserCheck}
          accent="text-cyan-400"
        />
        <StatCard
          title="Uso IA hoje"
          value={stats?.aiUsageToday ?? 0}
          icon={Sparkles}
          description={`${((aiStats?.totalTokens ?? 0) / 1000).toFixed(1)}k tokens total`}
          accent="text-amber-400"
        />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent conversations */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold">Conversas recentes</CardTitle>
              <Link to="/app/atendimento">
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

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Connections */}
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Wifi className="h-4 w-4 text-[#25D366]" />
                Conexões WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent>
              {connections.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground mb-3">Nenhuma conexão ativa</p>
                  <Link to="/app/whatsapp">
                    <Button size="sm" variant="outline" className="text-xs">Conectar</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {connections.map((conn) => (
                    <div key={conn.id} className="flex items-center gap-2.5 rounded-lg bg-accent/30 p-2.5">
                      <span className={cn(
                        "h-2 w-2 rounded-full shrink-0",
                        conn.status === "online" ? "bg-green-500" : conn.status === "connecting" ? "bg-yellow-500 animate-pulse" : "bg-red-500",
                      )} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{conn.name}</p>
                        <p className="text-[10px] text-muted-foreground">{conn.phone_number ?? conn.mode}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] capitalize">{conn.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Ações rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "Nova conversa", to: "/app/atendimento", icon: MessageSquare },
                { label: "Adicionar contato", to: "/app/clientes", icon: Users },
                { label: "Conectar WhatsApp", to: "/app/whatsapp", icon: Smartphone },
                { label: "Configurar IA", to: "/app/ia-gemini", icon: Sparkles },
              ].map((action) => (
                <Link key={action.to} to={action.to}>
                  <Button variant="outline" className="w-full justify-start gap-3 h-9 text-sm font-normal border-border/50 hover:border-primary/30 hover:bg-primary/5">
                    <action.icon className="h-4 w-4 text-muted-foreground" />
                    {action.label}
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Plan */}
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
                  <span className="text-foreground font-medium">{connections.length} / {plan === "enterprise" ? "∞" : "3"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mensagens enviadas</span>
                  <span className="text-foreground font-medium">{stats?.sentToday ?? 0} hoje</span>
                </div>
                <div className="flex justify-between">
                  <span>IA interações</span>
                  <span className="text-foreground font-medium">{aiStats?.totalInteractions ?? 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
