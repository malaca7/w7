import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Smartphone, Plus, QrCode, CheckCircle2, AlertCircle,
  RefreshCw, Trash2, Wifi, WifiOff, X, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { fetchConnections, createConnection, updateConnectionStatus, deleteConnection as deleteConn } from "@/lib/whatsapp-db";
import type { WhatsAppConnection, ConnectionStatus } from "@/lib/supabase";

export const Route = createFileRoute("/app/whatsapp")({
  component: WhatsAppPage,
});

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  online: { label: "Conectado", color: "text-green-500 bg-green-500/10", icon: CheckCircle2 },
  offline: { label: "Desconectado", color: "text-destructive bg-destructive/10", icon: WifiOff },
  connecting: { label: "Conectando…", color: "text-yellow-500 bg-yellow-500/10", icon: RefreshCw },
  error: { label: "Erro", color: "text-red-500 bg-red-500/10", icon: AlertCircle },
};

function ConnectionCard({ conn, onReconnect, onDelete }: {
  conn: WhatsAppConnection;
  onReconnect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const s = statusConfig[conn.status] ?? statusConfig.offline;
  return (
    <Card className="bg-card border-border/50 hover:border-border transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-[#25D366]" />
            </div>
            <div>
              <p className="font-semibold text-sm">{conn.name}</p>
              <p className="text-xs text-muted-foreground">{conn.phone_number ?? conn.mode}</p>
            </div>
          </div>
          <span className={cn("text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1.5", s.color)}>
            <s.icon className={cn("h-3 w-3", conn.status === "connecting" && "animate-spin")} />
            {s.label}
          </span>
        </div>

        <div className="flex gap-4 text-xs text-muted-foreground border-t border-border/40 pt-3">
          <div>
            <p className="font-semibold text-foreground">{conn.sent_count}</p>
            <p>enviadas</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">{conn.received_count}</p>
            <p>recebidas</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">{conn.conversation_count}</p>
            <p>conversas</p>
          </div>
        </div>

        {conn.battery != null && (
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span>🔋 {conn.battery}%</span>
            {conn.device_name && <span>· {conn.device_name}</span>}
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">Auto-reconexão</span>
            <span className={cn("h-1.5 w-1.5 rounded-full", conn.auto_reconnect ? "bg-green-500" : "bg-muted-foreground")} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => onReconnect(conn.id)}>
              <RefreshCw className="h-3 w-3" />
              Reconectar
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(conn.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WhatsAppPage() {
  const { authUser } = useAuth();
  const companyId = authUser?.company.id;
  const queryClient = useQueryClient();

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newMode, setNewMode] = useState<string>("qr_device");
  const [autoReconnect, setAutoReconnect] = useState(true);

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ["connections", companyId],
    enabled: !!companyId,
    queryFn: () => fetchConnections(companyId!),
    refetchInterval: 15_000,
  });

  const createMutation = useMutation({
    mutationFn: () => createConnection(companyId!, {
      name: newName,
      mode: newMode,
      phone_number: newPhone,
      auto_reconnect: autoReconnect,
    }),
    onSuccess: () => {
      toast.success("Conexão criada! Aguardando escaneamento do QR Code.");
      void queryClient.invalidateQueries({ queryKey: ["connections", companyId] });
      setShowAdd(false);
      setNewName("");
      setNewPhone("");
    },
    onError: () => toast.error("Erro ao criar conexão"),
  });

  const reconnectMutation = useMutation({
    mutationFn: (id: string) => updateConnectionStatus(id, "connecting"),
    onSuccess: () => {
      toast.success("Reconectando...");
      void queryClient.invalidateQueries({ queryKey: ["connections", companyId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteConn(id),
    onSuccess: () => {
      toast.success("Conexão removida");
      void queryClient.invalidateQueries({ queryKey: ["connections", companyId] });
    },
  });

  const onlineCount = connections.filter((c) => c.status === "online").length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="WhatsApp / Conexões"
        description={`${connections.length} conexões · ${onlineCount} online`}
        actions={
          <Button size="sm" className="gap-2" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" />
            Nova conexão
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-52 rounded-xl bg-card animate-pulse" />
          ))}
        </div>
      ) : connections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-20 w-20 rounded-2xl bg-[#25D366]/10 flex items-center justify-center mb-5">
            <Smartphone className="h-10 w-10 text-[#25D366]" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Nenhum WhatsApp conectado</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            Conecte seu número de WhatsApp para começar a receber e enviar mensagens pela plataforma.
          </p>
          <Button className="mt-6 gap-2" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" />
            Conectar WhatsApp
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {connections.map((conn) => (
            <ConnectionCard
              key={conn.id}
              conn={conn}
              onReconnect={(id) => reconnectMutation.mutate(id)}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
          <button
            onClick={() => setShowAdd(true)}
            className="rounded-xl border-2 border-dashed border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary min-h-[200px]"
          >
            <Plus className="h-6 w-6" />
            <span className="text-sm font-medium">Adicionar conexão</span>
          </button>
        </div>
      )}

      {/* Add Connection Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border/50 rounded-2xl p-6 w-full max-w-md space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Conectar WhatsApp</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)} className="h-7 w-7 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Nome da conexão</label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Suporte, Vendas…"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Número do WhatsApp</label>
                <Input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+55 11 99999-9999"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Modo de conexão</label>
                <Select value={newMode} onValueChange={setNewMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qr_device">QR Code (Dispositivo)</SelectItem>
                    <SelectItem value="meta_api">API Meta (Business)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Auto-reconexão</p>
                  <p className="text-xs text-muted-foreground">Reconectar automaticamente se desconectar</p>
                </div>
                <Switch checked={autoReconnect} onCheckedChange={setAutoReconnect} />
              </div>

              {newMode === "qr_device" && (
                <div className="aspect-square max-w-[200px] mx-auto bg-white rounded-xl flex items-center justify-center">
                  <div className="text-center p-4">
                    <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">QR code será gerado após criar</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={() => createMutation.mutate()}
                disabled={!newName.trim() || createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Criar conexão
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
