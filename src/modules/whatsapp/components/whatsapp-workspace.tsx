import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "motion/react";
import { useForm } from "react-hook-form";
import {
  Activity,
  ArrowRightLeft,
  Bot,
  Building2,
  Check,
  CheckCheck,
  Clock3,
  Crown,
  Gauge,
  Hash,
  Headset,
  Inbox,
  LifeBuoy,
  MessageCircle,
  Mic,
  MonitorSmartphone,
  Paperclip,
  Phone,
  PhoneCall,
  Plus,
  QrCode,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Users,
  Video,
  Wifi,
  WifiOff,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_TENANT_ID } from "@/modules/whatsapp/mock";
import {
  connectionSchema,
  noteSchema,
  scheduleMessageSchema,
  sendMessageSchema,
  type ConnectionForm,
  type NoteForm,
  type ScheduleMessageForm,
  type SendMessageForm,
} from "@/modules/whatsapp/schemas";
import {
  useConversationMessages,
  useConversationViews,
  useRealtimeSync,
  useSendMessage,
  useWhatsAppActions,
  useWhatsAppWorkspace,
} from "@/modules/whatsapp/hooks";
import type {
  ConversationPriority,
  ConversationStatus,
  ConversationView,
  Message,
  TenantRole,
} from "@/modules/whatsapp/types";

const ROLE_LABEL: Record<TenantRole, string> = {
  super_admin: "Super Admin",
  admin: "Administrador",
  supervisor: "Supervisor",
  agent: "Atendente",
};

const STATUS_LABEL: Record<ConversationStatus, string> = {
  new: "Novo",
  pending: "Aguardando",
  in_progress: "Em atendimento",
  paused: "Pausado",
  closed: "Finalizado",
  archived: "Arquivado",
};

const PRIORITY_LABEL: Record<ConversationPriority, string> = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  critical: "Crítica",
};

const FILTER_STATUS: Array<{ value: ConversationStatus | "all"; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "new", label: "Novo" },
  { value: "pending", label: "Aguardando" },
  { value: "in_progress", label: "Em atendimento" },
  { value: "paused", label: "Pausado" },
  { value: "closed", label: "Finalizado" },
  { value: "archived", label: "Arquivado" },
];

interface WhatsAppWorkspaceProps {
  tenantId?: string;
  currentAgentId?: string;
}

function statusColor(status: ConversationStatus) {
  if (status === "new") return "text-[#A6FF00]";
  if (status === "pending") return "text-[#FFD166]";
  if (status === "in_progress") return "text-[#4ADE80]";
  if (status === "paused") return "text-[#F59E0B]";
  if (status === "closed") return "text-[#94A3B8]";
  return "text-[#64748B]";
}

function connectionStatusColor(status: "online" | "offline" | "connecting" | "error") {
  if (status === "online") return "bg-emerald-400";
  if (status === "connecting") return "bg-amber-400";
  if (status === "error") return "bg-rose-500";
  return "bg-slate-500";
}

function MessageState({ message }: { message: Message }) {
  if (!message.fromMe) {
    return <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Recebida</span>;
  }

  if (message.readAt) {
    return <CheckCheck className="h-3.5 w-3.5 text-primary" />;
  }

  if (message.deliveredAt) {
    return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />;
  }

  return <Check className="h-3.5 w-3.5 text-muted-foreground" />;
}

export function WhatsAppWorkspace({
  tenantId = DEFAULT_TENANT_ID,
  currentAgentId = "ag-1",
}: WhatsAppWorkspaceProps) {
  useRealtimeSync(tenantId);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("inbox");
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");

  const workspaceQuery = useWhatsAppWorkspace(tenantId);
  const conversationsQuery = useConversationViews(tenantId);

  const activeConversationId = conversationsQuery.data?.[0]?.conversation.id;
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(
    activeConversationId,
  );

  const selectedConversation = useMemo(
    () => conversationsQuery.data?.find((item) => item.conversation.id === selectedConversationId),
    [conversationsQuery.data, selectedConversationId],
  );

  const messagesQuery = useConversationMessages(tenantId, selectedConversation?.conversation.id);
  const sendMutation = useSendMessage(tenantId);
  const actions = useWhatsAppActions(tenantId, currentAgentId);

  const connectionForm = useForm<ConnectionForm>({
    resolver: zodResolver(connectionSchema),
    defaultValues: {
      mode: "qr_device",
      autoReconnect: true,
      name: "",
      phoneNumber: "",
    },
  });

  const messageForm = useForm<SendMessageForm>({
    resolver: zodResolver(sendMessageSchema),
    defaultValues: {
      conversationId: selectedConversation?.conversation.id ?? "",
      body: "",
      type: "text",
    },
  });

  const noteForm = useForm<NoteForm>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      conversationId: selectedConversation?.conversation.id ?? "",
      body: "",
    },
  });

  const scheduleForm = useForm<ScheduleMessageForm>({
    resolver: zodResolver(scheduleMessageSchema),
    defaultValues: {
      type: "once",
      body: "",
      scheduleAt: "",
    },
  });

  const filteredConversations = useMemo(() => {
    const all = conversationsQuery.data ?? [];
    const normalized = search.trim().toLowerCase();

    return all.filter((item) => {
      const statusPass = statusFilter === "all" || item.conversation.status === statusFilter;
      const searchPass = !normalized
        || item.contact.name.toLowerCase().includes(normalized)
        || item.contact.phone.toLowerCase().includes(normalized)
        || item.conversation.lastMessagePreview.toLowerCase().includes(normalized);

      return statusPass && searchPass;
    });
  }, [conversationsQuery.data, search, statusFilter]);

  const visibleMessages = useMemo(() => {
    const all = messagesQuery.data ?? [];
    const normalized = messageSearch.trim().toLowerCase();

    if (!normalized) {
      return all;
    }

    return all.filter((item) => item.body.toLowerCase().includes(normalized));
  }, [messagesQuery.data, messageSearch]);

  const workspace = workspaceQuery.data;

  if (workspaceQuery.isLoading || conversationsQuery.isLoading || !workspace) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-muted-foreground">
        Carregando central de atendimento W7...
      </div>
    );
  }

  const currentAgent = workspace.agents.find((item) => item.id === currentAgentId) ?? workspace.agents[0];

  const onSubmitConnection = connectionForm.handleSubmit(async (values) => {
    await actions.addConnection.mutateAsync(values);
    connectionForm.reset({ mode: "qr_device", autoReconnect: true, name: "", phoneNumber: "" });
  });

  const onSubmitMessage = messageForm.handleSubmit(async (values) => {
    if (!selectedConversation) return;

    await sendMutation.mutateAsync({
      conversationId: selectedConversation.conversation.id,
      body: values.body,
      type: values.type,
      agentId: currentAgent.id,
      quotedMessageId: values.quotedMessageId,
    });

    messageForm.reset({
      body: "",
      type: values.type,
      conversationId: selectedConversation.conversation.id,
      quotedMessageId: values.quotedMessageId,
    });
  });

  const onSubmitNote = noteForm.handleSubmit(async (values) => {
    if (!selectedConversation) return;
    await actions.addNote.mutateAsync({
      body: values.body,
      conversationId: selectedConversation.conversation.id,
    });
    noteForm.reset({ conversationId: selectedConversation.conversation.id, body: "" });
  });

  const onSubmitSchedule = scheduleForm.handleSubmit(async (values) => {
    await actions.createScheduledMessage.mutateAsync({
      ...values,
      contactId: selectedConversation?.contact.id,
      conversationId: selectedConversation?.conversation.id,
    });
    scheduleForm.reset({ type: "once", body: "", scheduleAt: "", recurrenceRule: "" });
  });

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-56 top-0 h-[480px] w-[480px] rounded-full bg-primary/20 blur-3xl animate-aurora" />
        <div className="absolute -right-36 bottom-0 h-[360px] w-[360px] rounded-full bg-emerald-400/10 blur-3xl animate-aurora" />
      </div>

      <div className="relative z-10 flex min-h-dvh">
        <aside
          className={`glass border-r border-white/10 transition-all duration-300 ${
            sidebarCollapsed ? "w-[88px]" : "w-[280px]"
          }`}
        >
          <div className="flex h-full flex-col p-4">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
                  <MessageCircle className="h-5 w-5" />
                </div>
                {!sidebarCollapsed ? (
                  <div>
                    <p className="text-sm font-semibold">W7 Atendimento</p>
                    <p className="text-xs text-muted-foreground">WhatsApp Multi-Tenant</p>
                  </div>
                ) : null}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSidebarCollapsed((item) => !item)}>
                <ArrowRightLeft className="h-4 w-4" />
              </Button>
            </div>

            <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Empresa</p>
              <p className="mt-1 text-sm font-medium">{tenantId}</p>
              {!sidebarCollapsed ? (
                <p className="mt-2 text-xs text-muted-foreground">{currentAgent.name} • {ROLE_LABEL[currentAgent.role]}</p>
              ) : null}
            </div>

            <div className="space-y-1">
              {[
                { value: "dashboard", label: "Dashboard", icon: Gauge },
                { value: "connections", label: "Conexões", icon: Wifi },
                { value: "inbox", label: "Inbox", icon: Inbox },
                { value: "crm", label: "CRM", icon: Building2 },
                { value: "queues", label: "Filas", icon: Headset },
                { value: "automations", label: "Automações", icon: Bot },
                { value: "permissions", label: "Permissões", icon: ShieldCheck },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setActiveTab(item.value)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                    activeTab === item.value
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed ? <span>{item.label}</span> : null}
                </button>
              ))}
            </div>

            <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-2">
                {workspace.metrics.connectedNumbers > 0 ? (
                  <Wifi className="h-4 w-4 text-primary" />
                ) : (
                  <WifiOff className="h-4 w-4 text-destructive" />
                )}
                {!sidebarCollapsed ? (
                  <p className="text-xs text-muted-foreground">
                    {workspace.metrics.connectedNumbers} números online
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-4 lg:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Módulo WhatsApp & Atendimento</h1>
              <p className="text-sm text-muted-foreground">
                Operação em tempo real, múltiplos números por empresa e gestão completa de atendimento.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/20 text-primary">Realtime ativo</Badge>
              <Button
                variant="subtle"
                size="sm"
                onClick={() => {
                  if (selectedConversation) {
                    void actions.triggerMockIncoming.mutateAsync(selectedConversation.conversation.id);
                  }
                }}
              >
                Simular mensagem
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 h-auto w-full flex-wrap justify-start gap-1 bg-white/5 p-1">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="connections">Conexões</TabsTrigger>
              <TabsTrigger value="inbox">Inbox</TabsTrigger>
              <TabsTrigger value="crm">CRM</TabsTrigger>
              <TabsTrigger value="queues">Filas e Departamentos</TabsTrigger>
              <TabsTrigger value="automations">Automações e Agenda</TabsTrigger>
              <TabsTrigger value="permissions">Permissões</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {[
                  {
                    label: "Conversas abertas",
                    value: workspace.metrics.openConversations,
                    icon: Inbox,
                  },
                  {
                    label: "Finalizadas",
                    value: workspace.metrics.closedConversations,
                    icon: CheckCheck,
                  },
                  {
                    label: "1ª resposta (s)",
                    value: workspace.metrics.avgFirstResponseSeconds,
                    icon: Clock3,
                  },
                  {
                    label: "Atendentes online",
                    value: workspace.metrics.onlineAgents,
                    icon: Users,
                  },
                  {
                    label: "Números conectados",
                    value: workspace.metrics.connectedNumbers,
                    icon: PhoneCall,
                  },
                ].map((item) => (
                  <Card key={item.label} className="glass border-white/10">
                    <CardHeader className="pb-2">
                      <CardDescription>{item.label}</CardDescription>
                      <CardTitle className="flex items-center justify-between text-2xl">
                        {item.value}
                        <item.icon className="h-4 w-4 text-primary" />
                      </CardTitle>
                    </CardHeader>
                  </Card>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="glass border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Activity className="h-4 w-4 text-primary" />
                      Performance em tempo real
                    </CardTitle>
                    <CardDescription>Métricas-chave da operação omnichannel.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <MetricBar
                      label="Mensagens enviadas"
                      current={workspace.metrics.sentMessages}
                      total={workspace.metrics.sentMessages + workspace.metrics.receivedMessages}
                    />
                    <MetricBar
                      label="Mensagens recebidas"
                      current={workspace.metrics.receivedMessages}
                      total={workspace.metrics.sentMessages + workspace.metrics.receivedMessages}
                    />
                    <MetricBar
                      label="Tempo médio de atendimento"
                      current={workspace.metrics.avgHandleTimeMinutes}
                      total={30}
                      suffix=" min"
                    />
                  </CardContent>
                </Card>

                <Card className="glass border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Saúde da operação
                    </CardTitle>
                    <CardDescription>Status de conexões e backlog.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {workspace.connections.map((connection) => (
                      <div
                        key={connection.id}
                        className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium">{connection.name}</p>
                          <p className="text-xs text-muted-foreground">{connection.phoneNumber}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${connectionStatusColor(connection.status)}`} />
                          <p className="text-xs capitalize text-muted-foreground">{connection.status}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="connections" className="space-y-4">
              <Card className="glass border-white/10">
                <CardHeader>
                  <CardTitle className="text-base">Nova conexão WhatsApp</CardTitle>
                  <CardDescription>
                    Conecte por QR Code (dispositivo) ou API Oficial da Meta. Multi-número por empresa.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={onSubmitConnection} className="grid gap-3 md:grid-cols-5">
                    <Input
                      placeholder="Nome da conexão"
                      {...connectionForm.register("name")}
                      className="md:col-span-2"
                    />
                    <Select
                      value={connectionForm.watch("mode")}
                      onValueChange={(value) => connectionForm.setValue("mode", value as "qr_device" | "meta_api")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Modo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="qr_device">Dispositivo (QR Code)</SelectItem>
                        <SelectItem value="meta_api">API Oficial Meta</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="Número" {...connectionForm.register("phoneNumber")} />
                    <Button type="submit" variant="brand" disabled={actions.addConnection.isPending}>
                      <Plus className="h-4 w-4" />
                      Adicionar
                    </Button>
                  </form>
                  {connectionForm.formState.errors.name ? (
                    <p className="mt-2 text-xs text-destructive">{connectionForm.formState.errors.name.message}</p>
                  ) : null}
                </CardContent>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                {workspace.connections.map((connection) => (
                  <Card key={connection.id} className="glass border-white/10">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base">{connection.name}</CardTitle>
                          <CardDescription>{connection.phoneNumber ?? "Sem número"}</CardDescription>
                        </div>
                        <Badge className="bg-white/10 text-foreground">{connection.mode === "qr_device" ? "QR" : "Meta API"}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <Stat label="Status" value={connection.status} colorDotClass={connectionStatusColor(connection.status)} />
                        <Stat label="Saúde" value={connection.healthy ? "Saudável" : "Atenção"} />
                        <Stat label="Conversas" value={String(connection.conversationCount)} />
                        <Stat label="Bateria" value={connection.battery ? `${connection.battery}%` : "N/A"} />
                        <Stat label="Enviadas" value={String(connection.sentCount)} />
                        <Stat label="Recebidas" value={String(connection.receivedCount)} />
                      </div>

                      {connection.qrCode ? (
                        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                          <p className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <QrCode className="h-3.5 w-3.5" />
                            QR Code ativo
                          </p>
                          <p className="truncate text-xs text-primary">{connection.qrCode}</p>
                        </div>
                      ) : null}

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void actions.setConnectionStatus.mutateAsync({ connectionId: connection.id, status: "online" })}
                        >
                          Conectar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void actions.setConnectionStatus.mutateAsync({ connectionId: connection.id, status: "offline" })}
                        >
                          Desconectar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void actions.setConnectionStatus.mutateAsync({ connectionId: connection.id, status: "connecting" })}
                        >
                          Reconectar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => void actions.deleteConnection.mutateAsync(connection.id)}
                        >
                          Excluir
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Renomear conexão"
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              const target = event.target as HTMLInputElement;
                              if (target.value.trim()) {
                                void actions.renameConnection.mutateAsync({
                                  connectionId: connection.id,
                                  name: target.value.trim(),
                                });
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
                ))}
              </div>
            </TabsContent>

            <TabsContent value="inbox">
              <div className="grid min-h-[72dvh] gap-4 xl:grid-cols-[360px_1fr_340px]">
                <Card className="glass border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Caixa de entrada</CardTitle>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Buscar conversa"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                      />
                      <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ConversationStatus | "all") }>
                        <SelectTrigger className="w-[145px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          {FILTER_STATUS.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[62dvh] px-2 pb-2">
                      <div className="space-y-1">
                        {filteredConversations.map((item) => (
                          <button
                            key={item.conversation.id}
                            onClick={() => {
                              setSelectedConversationId(item.conversation.id);
                              messageForm.setValue("conversationId", item.conversation.id);
                              noteForm.setValue("conversationId", item.conversation.id);
                            }}
                            className={`w-full rounded-xl border p-3 text-left transition ${
                              selectedConversation?.conversation.id === item.conversation.id
                                ? "border-primary/40 bg-primary/10"
                                : "border-white/10 bg-white/5 hover:border-white/20"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium">{item.contact.name}</p>
                                <p className="text-xs text-muted-foreground">{item.contact.phone}</p>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(item.conversation.lastMessageAt).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">
                              {item.conversation.lastMessagePreview}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-1">
                              <Badge variant="outline" className={statusColor(item.conversation.status)}>
                                {STATUS_LABEL[item.conversation.status]}
                              </Badge>
                              {item.labels.map((label) => (
                                <Badge key={label.id} className="bg-white/10" style={{ color: label.color }}>
                                  {label.name}
                                </Badge>
                              ))}
                              {item.conversation.unreadCount > 0 ? (
                                <Badge className="bg-primary text-primary-foreground">
                                  {item.conversation.unreadCount}
                                </Badge>
                              ) : null}
                            </div>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card className="glass border-white/10">
                  <CardHeader className="border-b border-white/10 pb-3">
                    {selectedConversation ? (
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <CardTitle className="text-base">{selectedConversation.contact.name}</CardTitle>
                          <CardDescription>
                            {selectedConversation.contact.phone} • {STATUS_LABEL[selectedConversation.conversation.status]}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              void actions.updateConversation.mutateAsync({
                                conversationId: selectedConversation.conversation.id,
                                status: "in_progress",
                              })
                            }
                          >
                            Assumir
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              void actions.updateConversation.mutateAsync({
                                conversationId: selectedConversation.conversation.id,
                                status: "closed",
                              })
                            }
                          >
                            Encerrar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              void actions.updateConversation.mutateAsync({
                                conversationId: selectedConversation.conversation.id,
                                status: "new",
                              })
                            }
                          >
                            Reabrir
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <CardTitle className="text-base">Selecione uma conversa</CardTitle>
                    )}
                  </CardHeader>

                  <CardContent className="flex h-[62dvh] flex-col p-0">
                    <div className="border-b border-white/10 px-4 py-2">
                      <Input
                        value={messageSearch}
                        onChange={(event) => setMessageSearch(event.target.value)}
                        placeholder="Pesquisar no histórico"
                      />
                    </div>

                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-3">
                        <AnimatePresence initial={false}>
                          {visibleMessages.map((message) => (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={{ duration: 0.18 }}
                              className={`max-w-[82%] rounded-2xl border px-3 py-2 ${
                                message.fromMe
                                  ? "ml-auto border-primary/30 bg-primary/10"
                                  : "border-white/10 bg-white/5"
                              }`}
                            >
                              <p className="text-sm leading-relaxed">{message.body}</p>
                              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                                <span>
                                  {new Date(message.sentAt).toLocaleTimeString("pt-BR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    className={`transition ${message.favorited ? "text-primary" : "text-muted-foreground"}`}
                                    onClick={() => void actions.favoriteMessage.mutateAsync(message.id)}
                                    aria-label="Favoritar mensagem"
                                  >
                                    <Star className="h-3.5 w-3.5" />
                                  </button>
                                  <MessageState message={message} />
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </ScrollArea>

                    <div className="border-t border-white/10 p-3">
                      <form onSubmit={onSubmitMessage} className="space-y-2">
                        <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                          <Textarea
                            rows={2}
                            placeholder="Digite a mensagem..."
                            {...messageForm.register("body")}
                          />
                          <Select
                            value={messageForm.watch("type")}
                            onValueChange={(value) => messageForm.setValue("type", value as SendMessageForm["type"])}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Texto</SelectItem>
                              <SelectItem value="audio">Áudio</SelectItem>
                              <SelectItem value="image">Imagem</SelectItem>
                              <SelectItem value="video">Vídeo</SelectItem>
                              <SelectItem value="document">Documento</SelectItem>
                              <SelectItem value="pdf">PDF</SelectItem>
                              <SelectItem value="location">Localização</SelectItem>
                              <SelectItem value="contact">Contato</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button type="submit" variant="brand" disabled={sendMutation.isPending || !selectedConversation}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button type="button" variant="ghost" size="sm">
                            <Paperclip className="h-4 w-4" />
                            Arquivo
                          </Button>
                          <Button type="button" variant="ghost" size="sm">
                            <Mic className="h-4 w-4" />
                            Áudio
                          </Button>
                          <Button type="button" variant="ghost" size="sm">
                            <Video className="h-4 w-4" />
                            Vídeo
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const quick = workspace.quickReplies[0];
                              messageForm.setValue("body", `${messageForm.getValues("body")} ${quick}`.trim());
                            }}
                          >
                            <Sparkles className="h-4 w-4" />
                            Resposta rápida
                          </Button>
                        </div>
                      </form>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass border-white/10">
                  <CardHeader>
                    <CardTitle className="text-base">Atendimento e CRM</CardTitle>
                    <CardDescription>Departamento, fila, prioridade, notas e histórico.</CardDescription>
                  </CardHeader>
                  {selectedConversation ? (
                    <CardContent className="space-y-4">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <p className="text-sm font-medium">{selectedConversation.contact.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedConversation.contact.phone}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{selectedConversation.contact.email ?? "Sem e-mail"}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          value={selectedConversation.conversation.priority}
                          onValueChange={(value) =>
                            void actions.updateConversation.mutateAsync({
                              conversationId: selectedConversation.conversation.id,
                              priority: value as ConversationPriority,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Prioridade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Baixa</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                            <SelectItem value="critical">Crítica</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select
                          value={selectedConversation.conversation.departmentId}
                          onValueChange={(value) =>
                            void actions.updateConversation.mutateAsync({
                              conversationId: selectedConversation.conversation.id,
                              departmentId: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Departamento" />
                          </SelectTrigger>
                          <SelectContent>
                            {workspace.departments.map((department) => (
                              <SelectItem key={department.id} value={department.id}>
                                {department.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={selectedConversation.conversation.queueId}
                          onValueChange={(value) =>
                            void actions.updateConversation.mutateAsync({
                              conversationId: selectedConversation.conversation.id,
                              queueId: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Fila" />
                          </SelectTrigger>
                          <SelectContent>
                            {workspace.queues.map((queue) => (
                              <SelectItem key={queue.id} value={queue.id}>
                                {queue.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={selectedConversation.conversation.assignedAgentId}
                          onValueChange={(value) =>
                            void actions.updateConversation.mutateAsync({
                              conversationId: selectedConversation.conversation.id,
                              assignedAgentId: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Transferir para" />
                          </SelectTrigger>
                          <SelectContent>
                            {workspace.agents.map((agent) => (
                              <SelectItem key={agent.id} value={agent.id}>
                                {agent.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <form onSubmit={onSubmitNote} className="space-y-2">
                        <Textarea rows={3} placeholder="Nota interna" {...noteForm.register("body")} />
                        <Button type="submit" size="sm" variant="outline">
                          Adicionar nota
                        </Button>
                      </form>

                      <div className="max-h-[260px] space-y-2 overflow-auto pr-1">
                        {workspace.logs
                          .filter((item) => item.conversationId === selectedConversation.conversation.id)
                          .slice(0, 8)
                          .map((item) => (
                            <div
                              key={item.id}
                              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-muted-foreground"
                            >
                              <p className="font-medium text-foreground">{item.action}</p>
                              <p>{new Date(item.createdAt).toLocaleString("pt-BR")}</p>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  ) : null}
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="crm" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {workspace.contacts.map((contact) => (
                  <Card key={contact.id} className="glass border-white/10">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-base">
                        <span>{contact.name}</span>
                        <Phone className="h-4 w-4 text-primary" />
                      </CardTitle>
                      <CardDescription>{contact.phone}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p><span className="text-muted-foreground">Email:</span> {contact.email ?? "-"}</p>
                      <p><span className="text-muted-foreground">Empresa:</span> {contact.company ?? "-"}</p>
                      <p><span className="text-muted-foreground">Cidade:</span> {contact.city ?? "-"} / {contact.state ?? "-"}</p>
                      <p><span className="text-muted-foreground">CPF/CNPJ:</span> {contact.document ?? "-"}</p>
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">Último atendimento: {contact.lastConversationAt ? new Date(contact.lastConversationAt).toLocaleString("pt-BR") : "-"}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="queues" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="glass border-white/10">
                  <CardHeader>
                    <CardTitle className="text-base">Filas e distribuição automática</CardTitle>
                    <CardDescription>
                      Encaminhamento por prioridade, horário e disponibilidade de atendentes.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {workspace.queues.map((queue) => (
                      <div
                        key={queue.id}
                        className="rounded-xl border border-white/10 bg-white/5 p-3"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <p className="font-medium">{queue.name}</p>
                          <Badge className="bg-white/10" style={{ color: queue.color }}>
                            Prioridade {queue.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Horário: {queue.businessHours}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Auto mensagem: {queue.autoMessage}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Atendentes vinculados: {queue.agentIds.length}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="glass border-white/10">
                  <CardHeader>
                    <CardTitle className="text-base">Departamentos</CardTitle>
                    <CardDescription>Comercial, Financeiro, Suporte, SAC e Pós-venda.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {workspace.departments.map((department) => (
                      <div
                        key={department.id}
                        className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: department.color }} />
                          <p className="text-sm">{department.name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {workspace.agents.filter((agent) => agent.departmentIds.includes(department.id)).length} atendentes
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="automations" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="glass border-white/10">
                  <CardHeader>
                    <CardTitle className="text-base">Mensagens automáticas</CardTitle>
                    <CardDescription>
                      Boas-vindas, ausência, fora do horário, encerramento, CSAT e respostas rápidas.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {workspace.automations.map((automation) => (
                      <div
                        key={automation.id}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{automation.name}</p>
                          <Badge className={automation.active ? "bg-primary/20 text-primary" : "bg-white/10"}>
                            {automation.active ? "Ativa" : "Inativa"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{automation.triggerDescription}</p>
                        <p className="mt-1 text-xs">{automation.messageTemplate}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="glass border-white/10">
                  <CardHeader>
                    <CardTitle className="text-base">Agendador</CardTitle>
                    <CardDescription>Envios únicos ou recorrentes com histórico completo.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <form onSubmit={onSubmitSchedule} className="space-y-2">
                      <Textarea rows={2} placeholder="Mensagem agendada" {...scheduleForm.register("body")} />
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          value={scheduleForm.watch("type")}
                          onValueChange={(value) => scheduleForm.setValue("type", value as "once" | "recurring")}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="once">Único</SelectItem>
                            <SelectItem value="recurring">Recorrente</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input type="datetime-local" {...scheduleForm.register("scheduleAt")} />
                      </div>
                      {scheduleForm.watch("type") === "recurring" ? (
                        <Input
                          placeholder="Regra RRULE"
                          {...scheduleForm.register("recurrenceRule")}
                        />
                      ) : null}
                      <Button type="submit" size="sm" variant="brand">
                        Agendar mensagem
                      </Button>
                    </form>

                    <div className="space-y-2">
                      {workspace.scheduledMessages.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                        >
                          <div>
                            <p className="line-clamp-1">{item.body}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(item.scheduleAt).toLocaleString("pt-BR")} • {item.type}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => void actions.cancelScheduledMessage.mutateAsync(item.id)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4">
              <Card className="glass border-white/10">
                <CardHeader>
                  <CardTitle className="text-base">Controle de acesso granular</CardTitle>
                  <CardDescription>Perfis: Super Admin, Administrador, Supervisor e Atendente.</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-muted-foreground">
                        <th className="px-2 py-2">Permissão</th>
                        <th className="px-2 py-2">Super Admin</th>
                        <th className="px-2 py-2">Administrador</th>
                        <th className="px-2 py-2">Supervisor</th>
                        <th className="px-2 py-2">Atendente</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Gerenciar conexões", true, true, false, false],
                        ["Transferir atendimento", true, true, true, true],
                        ["Configurar automações", true, true, true, false],
                        ["Alterar permissões", true, true, false, false],
                        ["Ver dashboard global", true, true, true, false],
                        ["Acessar CRM", true, true, true, true],
                      ].map((row) => (
                        <tr key={row[0] as string} className="border-b border-white/5">
                          <td className="px-2 py-2">{row[0] as string}</td>
                          {row.slice(1).map((allowed, index) => (
                            <td key={`${row[0]}-${index}`} className="px-2 py-2">
                              {allowed ? <Check className="h-4 w-4 text-primary" /> : <span className="text-muted-foreground">-</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {workspace.agents.map((agent) => (
                  <Card key={agent.id} className="glass border-white/10">
                    <CardHeader>
                      <CardTitle className="text-base">{agent.name}</CardTitle>
                      <CardDescription>{ROLE_LABEL[agent.role]}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${agent.online ? "bg-emerald-400" : "bg-slate-500"}`} />
                        {agent.online ? "Online" : "Offline"}
                      </p>
                      <p className="text-muted-foreground">
                        Departamentos: {agent.departmentIds.length}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

function MetricBar({
  label,
  current,
  total,
  suffix = "",
}: {
  label: string;
  current: number;
  total: number;
  suffix?: string;
}) {
  const progress = total === 0 ? 0 : Math.min(100, (current / total) * 100);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>
          {current}
          {suffix}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/10">
        <div className="h-full rounded-full bg-[image:var(--gradient-brand)]" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  colorDotClass,
}: {
  label: string;
  value: string;
  colorDotClass?: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-2">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        {colorDotClass ? <span className={`h-2.5 w-2.5 rounded-full ${colorDotClass}`} /> : null}
        <p className="text-sm capitalize">{value}</p>
      </div>
    </div>
  );
}
