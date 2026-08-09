import { motion } from "motion/react";
import {
  Activity,
  CheckCheck,
  Clock3,
  Inbox,
  PhoneCall,
  Sparkles,
  Users,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { connectionStatusColor } from "@/modules/whatsapp/constants";
import { MetricBar } from "@/modules/whatsapp/components/metric-bar";
import type { DashboardMetrics, WhatsAppConnection } from "@/modules/whatsapp/types";

interface DashboardTabProps {
  metrics: DashboardMetrics;
  connections: WhatsAppConnection[];
}

const KPI_ITEMS = [
  { label: "Conversas abertas", key: "openConversations" as const, icon: Inbox },
  { label: "Finalizadas", key: "closedConversations" as const, icon: CheckCheck },
  { label: "1ª resposta (s)", key: "avgFirstResponseSeconds" as const, icon: Clock3 },
  { label: "Atendentes online", key: "onlineAgents" as const, icon: Users },
  { label: "Números conectados", key: "connectedNumbers" as const, icon: PhoneCall },
];

export function DashboardTab({ metrics, connections }: DashboardTabProps) {
  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {KPI_ITEMS.map((item, index) => (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.06 }}
          >
            <Card className="glass border-white/10">
              <CardHeader className="pb-2">
                <CardDescription>{item.label}</CardDescription>
                <CardTitle className="flex items-center justify-between text-2xl">
                  <motion.span
                    key={metrics[item.key]}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {metrics[item.key]}
                  </motion.span>
                  <item.icon className="h-4 w-4 text-primary" />
                </CardTitle>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Performance */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-primary" />
                Performance em tempo real
              </CardTitle>
              <CardDescription>
                Métricas-chave da operação omnichannel.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <MetricBar
                label="Mensagens enviadas"
                current={metrics.sentMessages}
                total={metrics.sentMessages + metrics.receivedMessages}
              />
              <MetricBar
                label="Mensagens recebidas"
                current={metrics.receivedMessages}
                total={metrics.sentMessages + metrics.receivedMessages}
              />
              <MetricBar
                label="Tempo médio de atendimento"
                current={metrics.avgHandleTimeMinutes}
                total={30}
                suffix=" min"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Health */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" />
                Saúde da operação
              </CardTitle>
              <CardDescription>
                Status de conexões e backlog.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{connection.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {connection.phoneNumber}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${connectionStatusColor(connection.status)}`}
                    />
                    <p className="text-xs capitalize text-muted-foreground">
                      {connection.status}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
