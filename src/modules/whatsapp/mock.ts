import type {
  Agent,
  Automation,
  ConnectionStatus,
  Contact,
  Conversation,
  ConversationActionLog,
  DashboardMetrics,
  Department,
  InternalNote,
  Label,
  Message,
  Queue,
  ScheduledMessage,
  WhatsAppConnection,
  WhatsAppWorkspaceData,
} from "@/modules/whatsapp/types";

const now = Date.now();

function iso(minutesAgo: number) {
  return new Date(now - minutesAgo * 60 * 1000).toISOString();
}

export const DEFAULT_TENANT_ID = "tenant-w7-demo";

export const departments: Department[] = [
  { id: "dep-commercial", tenantId: DEFAULT_TENANT_ID, name: "Comercial", color: "#A6FF00", active: true },
  { id: "dep-finance", tenantId: DEFAULT_TENANT_ID, name: "Financeiro", color: "#00D084", active: true },
  { id: "dep-support", tenantId: DEFAULT_TENANT_ID, name: "Suporte", color: "#00B3FF", active: true },
  { id: "dep-sac", tenantId: DEFAULT_TENANT_ID, name: "SAC", color: "#FFD166", active: true },
  { id: "dep-aftersale", tenantId: DEFAULT_TENANT_ID, name: "Pós-venda", color: "#FF7A59", active: true },
];

export const agents: Agent[] = [
  {
    id: "ag-1",
    tenantId: DEFAULT_TENANT_ID,
    name: "Ana Costa",
    role: "admin",
    online: true,
    avatarUrl: "https://i.pravatar.cc/100?img=5",
    departmentIds: ["dep-commercial", "dep-support"],
  },
  {
    id: "ag-2",
    tenantId: DEFAULT_TENANT_ID,
    name: "Lucas Prado",
    role: "supervisor",
    online: true,
    avatarUrl: "https://i.pravatar.cc/100?img=12",
    departmentIds: ["dep-support", "dep-sac"],
  },
  {
    id: "ag-3",
    tenantId: DEFAULT_TENANT_ID,
    name: "Marina Alves",
    role: "agent",
    online: false,
    avatarUrl: "https://i.pravatar.cc/100?img=9",
    departmentIds: ["dep-finance"],
  },
];

export const labels: Label[] = [
  { id: "lb-vip", tenantId: DEFAULT_TENANT_ID, name: "VIP", color: "#A6FF00" },
  { id: "lb-risk", tenantId: DEFAULT_TENANT_ID, name: "Risco", color: "#FF5D5D" },
  { id: "lb-upsell", tenantId: DEFAULT_TENANT_ID, name: "Upsell", color: "#35A7FF" },
];

export const queues: Queue[] = [
  {
    id: "q-commercial",
    tenantId: DEFAULT_TENANT_ID,
    name: "Fila Comercial",
    color: "#A6FF00",
    priority: 1,
    businessHours: "08:00-20:00",
    autoMessage: "Recebemos seu contato e já vamos responder.",
    agentIds: ["ag-1", "ag-2"],
  },
  {
    id: "q-support",
    tenantId: DEFAULT_TENANT_ID,
    name: "Fila Suporte",
    color: "#00B3FF",
    priority: 2,
    businessHours: "24x7",
    autoMessage: "Seu ticket está na fila de suporte técnico.",
    agentIds: ["ag-2", "ag-3"],
  },
];

export const connections: WhatsAppConnection[] = [
  {
    id: "cn-1",
    tenantId: DEFAULT_TENANT_ID,
    name: "Matriz - Vendas",
    mode: "qr_device",
    status: "online",
    qrCode: null,
    deviceName: "iPhone da Matriz",
    phoneNumber: "+55 11 99999-1001",
    profilePhotoUrl: "https://i.pravatar.cc/100?img=15",
    profileName: "W7 Vendas",
    battery: 86,
    healthy: true,
    lastSyncAt: iso(2),
    conversationCount: 145,
    sentCount: 3445,
    receivedCount: 3090,
    autoReconnect: true,
  },
  {
    id: "cn-2",
    tenantId: DEFAULT_TENANT_ID,
    name: "Suporte API Oficial",
    mode: "meta_api",
    status: "online",
    qrCode: null,
    deviceName: "Meta Cloud API",
    phoneNumber: "+55 11 99999-2002",
    profilePhotoUrl: "https://i.pravatar.cc/100?img=19",
    profileName: "W7 Support",
    healthy: true,
    lastSyncAt: iso(1),
    conversationCount: 312,
    sentCount: 5840,
    receivedCount: 6102,
    autoReconnect: true,
  },
  {
    id: "cn-3",
    tenantId: DEFAULT_TENANT_ID,
    name: "Financeiro",
    mode: "qr_device",
    status: "connecting",
    qrCode: "otpauth://totp/W7?secret=WHATSAPPQRDEMO",
    deviceName: "Samsung Financeiro",
    phoneNumber: "+55 11 99999-3003",
    profileName: "W7 Financeiro",
    battery: 51,
    healthy: false,
    lastSyncAt: iso(45),
    conversationCount: 52,
    sentCount: 450,
    receivedCount: 602,
    autoReconnect: true,
  },
];

export const contacts: Contact[] = [
  {
    id: "ct-1",
    tenantId: DEFAULT_TENANT_ID,
    name: "Paulo Medeiros",
    phone: "+55 11 98765-1234",
    email: "paulo@alpha.com",
    company: "Alpha Tecnologia",
    city: "São Paulo",
    state: "SP",
    document: "12.345.678/0001-90",
    avatarUrl: "https://i.pravatar.cc/100?img=32",
    tags: ["VIP", "Enterprise"],
    notes: "Cliente estratégico, prefere atendimento por áudio.",
    lastConversationAt: iso(3),
  },
  {
    id: "ct-2",
    tenantId: DEFAULT_TENANT_ID,
    name: "Carla Monteiro",
    phone: "+55 21 97654-4321",
    email: "carla@beta.com",
    company: "Beta E-commerce",
    city: "Rio de Janeiro",
    state: "RJ",
    document: "123.456.789-10",
    avatarUrl: "https://i.pravatar.cc/100?img=25",
    tags: ["Renovação"],
    lastConversationAt: iso(25),
  },
  {
    id: "ct-3",
    tenantId: DEFAULT_TENANT_ID,
    name: "Rafael Souza",
    phone: "+55 31 95555-8798",
    city: "Belo Horizonte",
    state: "MG",
    tags: ["Suporte"],
    lastConversationAt: iso(110),
  },
];

export const conversations: Conversation[] = [
  {
    id: "cv-1",
    tenantId: DEFAULT_TENANT_ID,
    contactId: "ct-1",
    connectionId: "cn-1",
    channel: "whatsapp",
    status: "in_progress",
    queueId: "q-commercial",
    departmentId: "dep-commercial",
    assignedAgentId: "ag-1",
    priority: "critical",
    labelIds: ["lb-vip", "lb-upsell"],
    unreadCount: 0,
    lastMessagePreview: "Perfeito, pode me enviar a proposta anual?",
    lastMessageAt: iso(3),
    createdAt: iso(200),
  },
  {
    id: "cv-2",
    tenantId: DEFAULT_TENANT_ID,
    contactId: "ct-2",
    connectionId: "cn-2",
    channel: "meta_api",
    status: "pending",
    queueId: "q-support",
    departmentId: "dep-support",
    assignedAgentId: "ag-2",
    priority: "high",
    labelIds: ["lb-risk"],
    unreadCount: 2,
    lastMessagePreview: "Estou com instabilidade no envio de campanhas",
    lastMessageAt: iso(25),
    createdAt: iso(400),
  },
  {
    id: "cv-3",
    tenantId: DEFAULT_TENANT_ID,
    contactId: "ct-3",
    connectionId: "cn-3",
    channel: "whatsapp",
    status: "new",
    queueId: "q-support",
    departmentId: "dep-sac",
    priority: "normal",
    labelIds: [],
    unreadCount: 4,
    lastMessagePreview: "Consigo atualizar o boleto pelo WhatsApp?",
    lastMessageAt: iso(110),
    createdAt: iso(560),
  },
];

export const messages: Message[] = [
  {
    id: "msg-1",
    tenantId: DEFAULT_TENANT_ID,
    conversationId: "cv-1",
    contactId: "ct-1",
    body: "Olá, quero migrar 12 atendentes para o plano enterprise.",
    type: "text",
    fromMe: false,
    sentAt: iso(11),
    favorited: false,
    attachments: [],
  },
  {
    id: "msg-2",
    tenantId: DEFAULT_TENANT_ID,
    conversationId: "cv-1",
    contactId: "ct-1",
    agentId: "ag-1",
    body: "Excelente! Já vou te enviar uma simulação personalizada.",
    type: "text",
    fromMe: true,
    sentAt: iso(8),
    deliveredAt: iso(8),
    readAt: iso(6),
    favorited: true,
    attachments: [],
  },
  {
    id: "msg-3",
    tenantId: DEFAULT_TENANT_ID,
    conversationId: "cv-1",
    contactId: "ct-1",
    body: "Perfeito, pode me enviar a proposta anual?",
    type: "text",
    fromMe: false,
    sentAt: iso(3),
    favorited: false,
    attachments: [],
  },
  {
    id: "msg-4",
    tenantId: DEFAULT_TENANT_ID,
    conversationId: "cv-2",
    contactId: "ct-2",
    body: "Estou com instabilidade no envio de campanhas",
    type: "text",
    fromMe: false,
    sentAt: iso(25),
    favorited: false,
    attachments: [],
  },
  {
    id: "msg-5",
    tenantId: DEFAULT_TENANT_ID,
    conversationId: "cv-3",
    contactId: "ct-3",
    body: "Consigo atualizar o boleto pelo WhatsApp?",
    type: "text",
    fromMe: false,
    sentAt: iso(110),
    favorited: false,
    attachments: [],
  },
];

export const notes: InternalNote[] = [
  {
    id: "nt-1",
    tenantId: DEFAULT_TENANT_ID,
    conversationId: "cv-1",
    agentId: "ag-1",
    body: "Cliente tem orçamento aprovado. Priorizar fechamento esta semana.",
    createdAt: iso(7),
  },
];

export const automations: Automation[] = [
  {
    id: "auto-1",
    tenantId: DEFAULT_TENANT_ID,
    type: "welcome",
    active: true,
    name: "Boas-vindas padrão",
    triggerDescription: "Primeira mensagem recebida",
    messageTemplate: "Olá! Seja bem-vindo(a) ao atendimento da W7.",
  },
  {
    id: "auto-2",
    tenantId: DEFAULT_TENANT_ID,
    type: "off_hours",
    active: true,
    name: "Fora do horário",
    triggerDescription: "Mensagem fora do expediente",
    messageTemplate: "Estamos fora do horário agora, retornaremos no próximo expediente.",
  },
  {
    id: "auto-3",
    tenantId: DEFAULT_TENANT_ID,
    type: "csat",
    active: true,
    name: "Pesquisa de satisfação",
    triggerDescription: "Conversa finalizada",
    messageTemplate: "Como você avalia nosso atendimento de 1 a 5?",
  },
];

export const scheduledMessages: ScheduledMessage[] = [
  {
    id: "sc-1",
    tenantId: DEFAULT_TENANT_ID,
    contactId: "ct-1",
    body: "Lembrete: reunião de alinhamento amanhã às 10h.",
    type: "once",
    scheduleAt: new Date(now + 2 * 60 * 60 * 1000).toISOString(),
    status: "scheduled",
    createdByAgentId: "ag-1",
  },
  {
    id: "sc-2",
    tenantId: DEFAULT_TENANT_ID,
    contactId: "ct-2",
    body: "Follow-up semanal de performance de campanhas.",
    type: "recurring",
    scheduleAt: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
    recurrenceRule: "FREQ=WEEKLY;BYDAY=MO;BYHOUR=9;BYMINUTE=0",
    status: "scheduled",
    createdByAgentId: "ag-2",
  },
];

export const logs: ConversationActionLog[] = [
  {
    id: "log-1",
    tenantId: DEFAULT_TENANT_ID,
    conversationId: "cv-1",
    action: "take",
    actorAgentId: "ag-1",
    metadata: { from: "fila_comercial" },
    createdAt: iso(180),
  },
  {
    id: "log-2",
    tenantId: DEFAULT_TENANT_ID,
    conversationId: "cv-2",
    action: "set_priority",
    actorAgentId: "ag-2",
    metadata: { oldPriority: "normal", newPriority: "high" },
    createdAt: iso(28),
  },
];

export const quickReplies = [
  "Olá! Obrigado pelo contato. Em instantes te respondo.",
  "Consegue me informar o CNPJ para validar seu cadastro?",
  "Perfeito, vou encaminhar para o time financeiro agora.",
  "Sua solicitação foi registrada e nosso time já está atuando.",
  "Posso te ajudar com mais alguma coisa?",
];

export function getMetrics(data: WhatsAppWorkspaceData): DashboardMetrics {
  const openConversations = data.conversations.filter((item) => item.status !== "closed").length;
  const closedConversations = data.conversations.filter((item) => item.status === "closed").length;

  const sentMessages = data.messages.filter((item) => item.fromMe).length;
  const receivedMessages = data.messages.filter((item) => !item.fromMe).length;

  return {
    openConversations,
    closedConversations,
    avgHandleTimeMinutes: 14,
    avgFirstResponseSeconds: 38,
    onlineAgents: data.agents.filter((item) => item.online).length,
    activeContacts: data.contacts.length,
    sentMessages,
    receivedMessages,
    connectedNumbers: data.connections.filter((item) => item.status === "online").length,
  };
}

export function makeStatusHealth(status: ConnectionStatus) {
  if (status === "online") {
    return true;
  }

  if (status === "connecting") {
    return false;
  }

  return false;
}
