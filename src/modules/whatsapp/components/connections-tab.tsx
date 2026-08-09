import { motion } from "motion/react";
import { Plus, Settings } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { connectionStatusColor } from "@/modules/whatsapp/constants";
import { connectionSchema, type ConnectionForm } from "@/modules/whatsapp/schemas";
import { QrCodeDisplay } from "@/modules/whatsapp/components/qr-code-display";
import { StatCard } from "@/modules/whatsapp/components/stat-card";
import type { WhatsAppConnection } from "@/modules/whatsapp/types";

interface ConnectionsTabProps {
  connections: WhatsAppConnection[];
  onAddConnection: (data: ConnectionForm) => Promise<void>;
  onSetStatus: (connectionId: string, status: WhatsAppConnection["status"]) => void;
  onRename: (connectionId: string, name: string) => void;
  onDelete: (connectionId: string) => void;
  isAdding: boolean;
}

export function ConnectionsTab({
  connections,
  onAddConnection,
  onSetStatus,
  onRename,
  onDelete,
  isAdding,
}: ConnectionsTabProps) {
  const form = useForm<ConnectionForm>({
    resolver: zodResolver(connectionSchema),
    defaultValues: {
      mode: "qr_device",
      autoReconnect: true,
      name: "",
      phoneNumber: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await onAddConnection(values);
    form.reset({ mode: "qr_device", autoReconnect: true, name: "", phoneNumber: "" });
  });

  return (
    <div className="space-y-4">
      {/* New connection form */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="text-base">Nova conexão WhatsApp</CardTitle>
            <CardDescription>
              Conecte por QR Code (dispositivo) ou API Oficial da Meta. Multi-número
              por empresa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-5">
              <Input
                placeholder="Nome da conexão"
                {...form.register("name")}
                className="md:col-span-2"
              />
              <Select
                value={form.watch("mode")}
                onValueChange={(value) =>
                  form.setValue("mode", value as "qr_device" | "meta_api")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Modo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="qr_device">
                    Dispositivo (QR Code)
                  </SelectItem>
                  <SelectItem value="meta_api">API Oficial Meta</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Número"
                {...form.register("phoneNumber")}
              />
              <Button type="submit" variant="brand" disabled={isAdding}>
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </form>
            {form.formState.errors.name ? (
              <p className="mt-2 text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </motion.div>

      {/* Connection cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {connections.map((connection, index) => (
          <motion.div
            key={connection.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.08 }}
          >
            <Card className="glass border-white/10">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">
                      {connection.name}
                    </CardTitle>
                    <CardDescription>
                      {connection.phoneNumber ?? "Sem número"}
                    </CardDescription>
                  </div>
                  <Badge className="bg-white/10 text-foreground">
                    {connection.mode === "qr_device" ? "QR" : "Meta API"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    label="Status"
                    value={connection.status}
                    colorDotClass={connectionStatusColor(connection.status)}
                  />
                  <StatCard
                    label="Saúde"
                    value={connection.healthy ? "Saudável" : "Atenção"}
                  />
                  <StatCard
                    label="Conversas"
                    value={String(connection.conversationCount)}
                  />
                  <StatCard
                    label="Bateria"
                    value={
                      connection.battery ? `${connection.battery}%` : "N/A"
                    }
                  />
                  <StatCard
                    label="Enviadas"
                    value={String(connection.sentCount)}
                  />
                  <StatCard
                    label="Recebidas"
                    value={String(connection.receivedCount)}
                  />
                </div>

                {/* QR Code */}
                {connection.qrCode ? (
                  <QrCodeDisplay
                    data={connection.qrCode}
                    onRefresh={() => onSetStatus(connection.id, "connecting")}
                  />
                ) : null}

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSetStatus(connection.id, "online")}
                  >
                    Conectar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSetStatus(connection.id, "offline")}
                  >
                    Desconectar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSetStatus(connection.id, "connecting")}
                  >
                    Reconectar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(connection.id)}
                  >
                    Excluir
                  </Button>
                </div>

                {/* Rename */}
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Renomear conexão"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        const target = event.target as HTMLInputElement;
                        if (target.value.trim()) {
                          onRename(connection.id, target.value.trim());
                          target.value = "";
                        }
                      }
                    }}
                  />
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
