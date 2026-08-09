import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { getSupabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Megaphone, Plus, Send, Pause, Play, Users, CheckCheck, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/app/campanhas")({
  component: CampanhasPage,
});

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "Rascunho", color: "text-muted-foreground bg-muted/50" },
  scheduled: { label: "Agendada", color: "text-blue-400 bg-blue-400/10" },
  running: { label: "Enviando", color: "text-yellow-500 bg-yellow-500/10" },
  paused: { label: "Pausada", color: "text-orange-500 bg-orange-500/10" },
  completed: { label: "Concluída", color: "text-green-500 bg-green-500/10" },
  failed: { label: "Falhou", color: "text-destructive bg-destructive/10" },
};

function CampanhasPage() {
  const { authUser } = useAuth();

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["campaigns", authUser?.company.id],
    enabled: !!authUser?.company.id,
    queryFn: async () => {
      const sb = getSupabase();
      if (!sb) return [];
      const { data } = await sb
        .from("campaigns")
        .select("*")
        .eq("company_id", authUser!.company.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Campanhas"
        description="Dispare mensagens em massa para seus contatos"
        actions={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Nova campanha
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-card animate-pulse" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <Megaphone className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Nenhuma campanha criada</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            Dispare mensagens personalizadas para segmentos específicos de contatos.
          </p>
          <Button className="mt-6 gap-2">
            <Plus className="h-4 w-4" />
            Criar campanha
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((camp: any) => {
            const s = statusConfig[camp.status] ?? statusConfig.draft;
            const total = camp.sent_count || 1;
            const deliveryRate = Math.round((camp.delivered_count / total) * 100);
            const readRate = Math.round((camp.read_count / total) * 100);
            return (
              <Card key={camp.id} className="bg-card border-border/50 hover:border-border transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Megaphone className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{camp.name}</h3>
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", s.color)}>
                          {s.label}
                        </span>
                      </div>
                      {camp.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{camp.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Send className="h-3 w-3" />
                          {camp.sent_count} enviados
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCheck className="h-3 w-3 text-primary" />
                          {deliveryRate}% entregues
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {readRate}% lidos
                        </span>
                        {camp.scheduled_at && (
                          <span>
                            Agendada para {format(parseISO(camp.scheduled_at), "d/MM HH:mm", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {camp.status === "running" ? (
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                          <Pause className="h-3 w-3" />
                          Pausar
                        </Button>
                      ) : camp.status === "paused" ? (
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                          <Play className="h-3 w-3" />
                          Retomar
                        </Button>
                      ) : camp.status === "draft" ? (
                        <Button size="sm" className="h-7 text-xs gap-1.5">
                          <Send className="h-3 w-3" />
                          Enviar
                        </Button>
                      ) : null}
                      <Button variant="ghost" size="sm" className="h-7 text-xs">Ver</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
