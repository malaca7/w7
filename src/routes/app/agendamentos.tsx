import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { getSupabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Plus, Clock, CheckCircle2, XCircle, User } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/agendamentos")({
  component: AgendamentosPage,
});

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  scheduled: { label: "Agendado", color: "text-blue-400 bg-blue-400/10", icon: Clock },
  confirmed: { label: "Confirmado", color: "text-primary bg-primary/10", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", color: "text-destructive bg-destructive/10", icon: XCircle },
  completed: { label: "Concluído", color: "text-green-500 bg-green-500/10", icon: CheckCircle2 },
};

function AgendamentosPage() {
  const { authUser } = useAuth();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments", authUser?.company.id],
    enabled: !!authUser?.company.id,
    queryFn: async () => {
      const sb = getSupabase();
      if (!sb) return [];
      const { data } = await sb
        .from("appointments")
        .select("*, contacts(name), profiles:assigned_to(full_name)")
        .eq("company_id", authUser!.company.id)
        .order("start_at", { ascending: true })
        .limit(50);
      return data ?? [];
    },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Agendamentos"
        description="Gerencie compromissos e reuniões"
        actions={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Novo agendamento
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-card animate-pulse" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <Calendar className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Nenhum agendamento</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            Crie agendamentos para organizar seus atendimentos e compromissos.
          </p>
          <Button className="mt-6 gap-2">
            <Plus className="h-4 w-4" />
            Criar agendamento
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt: any) => {
            const s = statusConfig[apt.status] ?? statusConfig.scheduled;
            const start = parseISO(apt.start_at);
            return (
              <Card key={apt.id} className="bg-card border-border/50 hover:border-border transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary shrink-0">
                    <span className="text-lg font-bold leading-none">{format(start, "d")}</span>
                    <span className="text-[10px] font-medium uppercase">{format(start, "MMM", { locale: ptBR })}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{apt.title}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(start, "HH:mm")}
                      </span>
                      {apt.contacts?.name && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {apt.contacts.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 shrink-0", s.color)}>
                    <s.icon className="h-3 w-3" />
                    {s.label}
                  </span>
                  <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0">Editar</Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
