import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Plus, QrCode, CheckCircle2, AlertCircle, RefreshCw, Trash2, Wifi, WifiOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/whatsapp")({
  component: WhatsAppPage,
});

type ConnStatus = "connected" | "disconnected" | "connecting" | "pending_qr";

interface Connection {
  id: string;
  name: string;
  phone: string;
  status: ConnStatus;
  messagesDay: number;
  lastActivity: string;
}

const mockConnections: Connection[] = [];

const statusConfig: Record<ConnStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  connected: { label: "Conectado", color: "text-green-500 bg-green-500/10", icon: CheckCircle2 },
  disconnected: { label: "Desconectado", color: "text-destructive bg-destructive/10", icon: WifiOff },
  connecting: { label: "Conectando…", color: "text-yellow-500 bg-yellow-500/10", icon: RefreshCw },
  pending_qr: { label: "Aguardando QR", color: "text-blue-400 bg-blue-400/10", icon: QrCode },
};

function ConnectionCard({ conn }: { conn: Connection }) {
  const s = statusConfig[conn.status];
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
              <p className="text-xs text-muted-foreground">{conn.phone}</p>
            </div>
          </div>
          <span className={cn("text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1.5", s.color)}>
            <s.icon className="h-3 w-3" />
            {s.label}
          </span>
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground border-t border-border/40 pt-3">
          <div>
            <p className="font-semibold text-foreground">{conn.messagesDay}</p>
            <p>msgs/hoje</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">{conn.lastActivity}</p>
            <p>última atividade</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" className="flex-1 h-7 text-xs gap-1.5">
            <RefreshCw className="h-3 w-3" />
            Reconectar
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function WhatsAppPage() {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="WhatsApp / Conexões"
        description="Gerencie seus números conectados"
        actions={
          <Button size="sm" className="gap-2" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" />
            Nova conexão
          </Button>
        }
      />

      {mockConnections.length === 0 ? (
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
          {mockConnections.map((conn) => (
            <ConnectionCard key={conn.id} conn={conn} />
          ))}
          <button
            onClick={() => setShowAdd(true)}
            className="rounded-xl border-2 border-dashed border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
          >
            <Plus className="h-6 w-6" />
            <span className="text-sm font-medium">Adicionar conexão</span>
          </button>
        </div>
      )}

      {/* QR Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border/50 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Conectar WhatsApp</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)} className="h-7 w-7 p-0">×</Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Abra o WhatsApp no seu celular, vá em <strong>Aparelhos Conectados</strong> e escaneie o QR code abaixo.
            </p>
            <div className="aspect-square bg-white rounded-xl flex items-center justify-center">
              <div className="text-center p-4">
                <QrCode className="h-20 w-20 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">QR code gerado via API</p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome da conexão</label>
              <input
                type="text"
                placeholder="Ex: Suporte, Vendas…"
                className="w-full h-9 px-3 rounded-lg border border-border/50 bg-background text-sm focus:outline-none focus:border-primary/50"
              />
            </div>
            <Button className="w-full" onClick={() => setShowAdd(false)}>Aguardar escaneamento</Button>
          </div>
        </div>
      )}
    </div>
  );
}
