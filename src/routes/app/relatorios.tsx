import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, MessageSquare, Users, Clock, Star, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts";

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
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Relatórios"
        description="Análise de desempenho do atendimento"
        actions={
          <Button size="sm" variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Conversas na semana", value: "259", icon: MessageSquare, trend: "+18%" },
          { label: "Tempo médio resposta", value: "3.2 min", icon: Clock, trend: "-12%" },
          { label: "Taxa de resolução", value: "91%", icon: Star, trend: "+5%" },
          { label: "Novos contatos", value: "47", icon: Users, trend: "+23%" },
        ].map((kpi) => (
          <Card key={kpi.label} className="bg-card border-border/50">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-1">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <kpi.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold mt-1">{kpi.value}</p>
              <p className="text-xs text-primary mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {kpi.trend} vs semana anterior
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Conversas por dia</CardTitle>
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
          <CardTitle className="text-sm font-semibold">Desempenho por atendente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "Ana Silva", resolved: 87, avg: "1.8min", satisfaction: 4.9 },
              { name: "Carlos Souza", resolved: 74, avg: "2.3min", satisfaction: 4.7 },
              { name: "Maria Santos", resolved: 65, avg: "3.1min", satisfaction: 4.6 },
              { name: "João Costa", resolved: 51, avg: "4.2min", satisfaction: 4.4 },
            ].map((agent, i) => (
              <div key={agent.name} className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground w-4">{i + 1}.</span>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {agent.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{agent.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="h-1 rounded-full bg-border flex-1 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${(agent.resolved / 87) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">{agent.resolved} resolvidas</p>
                  <p className="text-xs text-muted-foreground">TMA: {agent.avg} · ★ {agent.satisfaction}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
