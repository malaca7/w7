import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { getSupabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Plus, Zap, ToggleLeft, ToggleRight, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/chatbot")({
  component: ChatbotPage,
});

function ChatbotPage() {
  const { authUser } = useAuth();

  const { data: flows = [], isLoading, refetch } = useQuery({
    queryKey: ["chatbot-flows", authUser?.company.id],
    enabled: !!authUser?.company.id,
    queryFn: async () => {
      const sb = getSupabase();
      if (!sb) return [];
      const { data } = await sb
        .from("chatbot_flows")
        .select("*")
        .eq("company_id", authUser!.company.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const toggleFlow = async (flow: any) => {
    const sb = getSupabase();
    if (!sb) return;
    await sb.from("chatbot_flows").update({ is_active: !flow.is_active }).eq("id", flow.id);
    toast.success(flow.is_active ? "Fluxo desativado" : "Fluxo ativado");
    refetch();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Chatbot"
        description="Crie e gerencie fluxos de automação de atendimento"
        actions={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Novo fluxo
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-card animate-pulse" />
          ))}
        </div>
      ) : flows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <Bot className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Nenhum fluxo criado</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            Crie fluxos de chatbot para automatizar respostas e qualificar leads automaticamente.
          </p>
          <Button className="mt-6 gap-2">
            <Plus className="h-4 w-4" />
            Criar primeiro fluxo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {flows.map((flow: any) => (
            <Card key={flow.id} className="bg-card border-border/50 hover:border-border transition-colors">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Zap className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{flow.name}</p>
                      {flow.trigger && <p className="text-xs text-muted-foreground">Gatilho: {flow.trigger}</p>}
                    </div>
                  </div>
                  <button onClick={() => toggleFlow(flow)} className="text-muted-foreground hover:text-foreground">
                    {flow.is_active
                      ? <ToggleRight className="h-6 w-6 text-primary" />
                      : <ToggleLeft className="h-6 w-6" />}
                  </button>
                </div>
                {flow.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{flow.description}</p>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <Badge variant={flow.is_active ? "default" : "outline"} className={cn("text-[10px]", flow.is_active && "bg-primary/10 text-primary border-primary/20")}>
                    {flow.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <button className="rounded-xl border-2 border-dashed border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary">
            <Plus className="h-6 w-6" />
            <span className="text-sm font-medium">Novo fluxo</span>
          </button>
        </div>
      )}
    </div>
  );
}
