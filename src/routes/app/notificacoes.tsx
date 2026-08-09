import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { getSupabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Bell, Check, CheckCheck, Info, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/app/notificacoes")({
  component: NotificacoesPage,
});

const typeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  info: { icon: Info, color: "text-blue-400 bg-blue-400/10" },
  success: { icon: CheckCircle2, color: "text-green-500 bg-green-500/10" },
  warning: { icon: AlertTriangle, color: "text-yellow-500 bg-yellow-500/10" },
  error: { icon: AlertCircle, color: "text-destructive bg-destructive/10" },
};

function NotificacoesPage() {
  const { authUser } = useAuth();
  const qc = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", authUser?.profile.id],
    enabled: !!authUser?.profile.id,
    queryFn: async () => {
      const sb = getSupabase();
      if (!sb) return [];
      const { data } = await sb
        .from("notifications")
        .select("*")
        .eq("user_id", authUser!.profile.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabase();
      if (!sb) return;
      await sb.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = async () => {
    const sb = getSupabase();
    if (!sb) return;
    await sb.from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", authUser!.profile.id)
      .is("read_at", null);
    qc.invalidateQueries({ queryKey: ["notifications"] });
    toast.success("Todas as notificações marcadas como lidas");
  };

  const unread = notifications.filter((n: any) => !n.read_at).length;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Notificações"
        description={unread > 0 ? `${unread} não lidas` : "Todas lidas"}
        actions={
          unread > 0 ? (
            <Button variant="outline" size="sm" className="gap-2" onClick={markAllRead}>
              <CheckCheck className="h-4 w-4" />
              Marcar todas como lidas
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-card animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <Bell className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Nenhuma notificação</h3>
          <p className="text-sm text-muted-foreground mt-2">Você está em dia!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => {
            const t = typeConfig[n.type] ?? typeConfig.info;
            return (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border transition-colors",
                  n.read_at
                    ? "border-border/30 bg-card/30"
                    : "border-border/50 bg-card",
                )}
              >
                <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0", t.color)}>
                  <t.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", n.read_at && "text-muted-foreground")}>{n.title}</p>
                  {n.body && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                    {format(parseISO(n.created_at), "d MMM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                {!n.read_at && (
                  <button
                    onClick={() => markRead.mutate(n.id)}
                    className="shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                    title="Marcar como lida"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
