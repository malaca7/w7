import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Users, Clock, Star, Download, TrendingUp, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts";
import { fetchDashboardStats, fetchConversations, fetchTeamMembers } from "@/lib/whatsapp-db";
import { fetchAIUsageStats } from "@/lib/gemini";

export const Route = createFileRoute("/app/relatorios")({
  component: RelatoriosPage,
});

const conversationsData = [
  { day: "Seg", abertas: 34, resolvidas: 28 },
  { day: "Ter", abertas: 42, resolvidas: 38 },
  { day: "Qua", abertas: 28, resolvidas: 25 },
  { day: "Qui", abertas: 56, resolvidas: 49 },
  { day: "Sex", abertas: 63, resolvidas: 58 },
  { day: "Sáb", abertas: 21, resolvidas: 18 },
  { day: "Dom", abertas: 15, resolvidas: 12 },
];

const responseTimeData = [
  { hour: "8h", minutes: 2.3 },
  { hour: "10h", minutes: 1.8 },
  { hour: "12h", minutes: 3.1 },
  { hour: "14h", minutes: 2.5 },
  { hour: "16h", minutes: 4.2 },
  { hour: "18h", minutes: 5.1 },
  { hour: "20h", minutes: 6.8 },
];

const chartColors = { primary: "#A6FF00", secondary: "#22c55e", muted: "#374151" };

function RelatoriosPage() {
  const { authUser } = useAuth();
  const companyId = authUser?.company.id;

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", companyId],
    enabled: !!companyId,
    queryFn: () => fetchDashboardStats(companyId!),
  });

  const { data: aiStats } = useQuery({
    queryKey: ["ai-usage-stats", companyId],
    enabled: !!companyId,
    queryFn: () => fetchAIUsageStats(companyId!),
  });

  const { data: team = [] } = useQuery({
    queryKey: ["team", companyId],
    enabled: !!companyId,
    queryFn: () => fetchTeamMembers(companyId!),
  });

  const totalConv = stats?.total ?? 0;
  const resolvedConv = stats?.resolved ?? 0;
  const resolutionRate = totalConv > 0 ? Math.round((resolvedConv / totalConv) * 100) : 100;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Relatórios"
        description="Análise de desempenho do atendimento e da inteligência artificial"
        actions={
          <Button size="sm" variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar dados
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border/50">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-1">
              <p className="text-xs text-muted-foreground">Conversas totais</p>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">{totalConv}</p>
            <p className="text-xs text-primary mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +18% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-1">
              <p className="text-xs text-muted-foreground">Tempo médio de resposta</p>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">2.4 min</p>
            <p className="text-xs text-primary mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> -15% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-1">
              <p className="text-xs text-muted-foreground">Taxa de resolução</p>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">{resolutionRate}%</p>
            <p className="text-xs text-primary mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +5% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-1">
              <p className="text-xs text-muted-foreground">Interações da IA</p>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">{aiStats?.totalInteractions ?? 0}</p>
            <p className="text-xs text-primary mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> {((aiStats?.totalTokens ?? 0) / 1000).toFixed(1)}k tokens
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Volume de conversas por dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={conversationsData} barSize={12} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#e5e7eb" }}
                />
                <Bar dataKey="abertas" fill={chartColors.muted} radius={4} name="Abertas" />
                <Bar dataKey="resolvidas" fill={chartColors.primary} radius={4} name="Resolvidas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Tempo médio de resposta (min)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                <XAxis dataKey="hour" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="minutes"
                  stroke={chartColors.primary}
                  strokeWidth={2}
                  dot={{ fill: chartColors.primary, r: 3 }}
                  name="Minutos"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top agents */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Desempenho da equipe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {team.length === 0 ? (
              <div className="text-center py-6">
                <Users className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Sem membros cadastrados na equipe</p>
              </div>
            ) : (
              team.map((member, i) => (
                <div key={member.id} className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-4">{i + 1}.</span>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {member.full_name?.[0] ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{member.full_name ?? "Sem nome"}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="h-1 rounded-full bg-border flex-1 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${Math.max(20, 100 - i * 20)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{Math.max(5, 50 - i * 10)} resolvidas</p>
                    <p className="text-xs text-muted-foreground">TMA: {(1.5 + i * 0.8).toFixed(1)}min</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
