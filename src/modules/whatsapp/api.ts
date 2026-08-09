import {
  agents,
  automations,
  connections,
  contacts,
  conversations,
  departments,
  getMetrics,
  labels,
  logs,
  makeStatusHealth,
  notes,
  queues,
  quickReplies,
  scheduledMessages,
} from "@/modules/whatsapp/mock";
import { publishEvent } from "@/modules/whatsapp/realtime";
import type {
  Conversation,
  ConversationActionLog,
  ConversationPriority,
  ConversationStatus,
  ConversationView,
  DashboardMetrics,
  InternalNote,
  Message,
  WhatsAppConnection,
  WhatsAppWorkspaceData,
} from "@/modules/whatsapp/types";

const messages: Message[] = [];

function ensureSeededMessages() {
  if (messages.length > 0) {
    return;
  }

  messages.push(
    ...[
      {
        id: "msg-1",
        tenantId: "tenant-w7-demo",
        conversationId: "cv-1",
        contactId: "ct-1",
        body: "Olá, quero migrar 12 atendentes para o plano enterprise.",
        type: "text" as const,
        fromMe: false,
        sentAt: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
        favorited: false,
        attachments: [],
      },
      {
        id: "msg-2",
        tenantId: "tenant-w7-demo",
        conversationId: "cv-1",
        contactId: "ct-1",
        agentId: "ag-1",
        body: "Excelente! Já vou te enviar uma simulação personalizada.",
        type: "text" as const,
        fromMe: true,
        sentAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        deliveredAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        readAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
        favorited: true,
        attachments: [],
      },
      {
        id: "msg-3",
        tenantId: "tenant-w7-demo",
        conversationId: "cv-1",
        contactId: "ct-1",
        body: "Perfeito, pode me enviar a proposta anual?",
        type: "text" as const,
        fromMe: false,
        sentAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
        favorited: false,
        attachments: [],
      },
      {
        id: "msg-4",
        tenantId: "tenant-w7-demo",
        conversationId: "cv-2",
        contactId: "ct-2",
        body: "Estou com instabilidade no envio de campanhas",
        type: "text" as const,
        fromMe: false,
        sentAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        favorited: false,
        attachments: [],
      },
      {
        id: "msg-5",
        tenantId: "tenant-w7-demo",
        conversationId: "cv-3",
        contactId: "ct-3",
        body: "Consigo atualizar o boleto pelo WhatsApp?",
        type: "text" as const,
        fromMe: false,
        sentAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
        favorited: false,
        attachments: [],
      },
    ],
  );
}

ensureSeededMessages();

const workspaceByTenant = new Map<string, Omit<WhatsAppWorkspaceData, "metrics">>();

function newId(prefix: string) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function getTenantStore(tenantId: string) {
  if (!workspaceByTenant.has(tenantId)) {
    workspaceByTenant.set(tenantId, {
      connections: connections.map((item) => ({ ...item })),
      contacts: contacts.map((item) => ({ ...item })),
      conversations: conversations.map((item) => ({ ...item })),
      messages: messages.map((item) => ({ ...item })),
      departments: departments.map((item) => ({ ...item })),
      queues: queues.map((item) => ({ ...item })),
      agents: agents.map((item) => ({ ...item })),
      labels: labels.map((item) => ({ ...item })),
      notes: notes.map((item) => ({ ...item })),
      quickReplies: [...quickReplies],
      scheduledMessages: scheduledMessages.map((item) => ({ ...item })),
      automations: automations.map((item) => ({ ...item })),
      logs: logs.map((item) => ({ ...item })),
    });
  }

  return workspaceByTenant.get(tenantId)!;
}

export async function getWorkspaceData(tenantId: string): Promise<WhatsAppWorkspaceData> {
  const base = getTenantStore(tenantId);
  return {
    ...base,
    metrics: getMetrics({ ...base, metrics: {} as DashboardMetrics }),
  };
}

export async function getConversationViews(tenantId: string): Promise<ConversationView[]> {
  const data = getTenantStore(tenantId);

  return data.conversations
    .map((conversation) => {
      const contact = data.contacts.find((item) => item.id === conversation.contactId);
      if (!contact) {
        return null;
      }

      return {
        conversation,
        contact,
        agent: data.agents.find((item) => item.id === conversation.assignedAgentId),
        department: data.departments.find((item) => item.id === conversation.departmentId),
        queue: data.queues.find((item) => item.id === conversation.queueId),
        labels: data.labels.filter((item) => conversation.labelIds.includes(item.id)),
      } satisfies ConversationView;
    })
    .filter((item): item is ConversationView => item !== null)
    .sort((a, b) => +new Date(b.conversation.lastMessageAt) - +new Date(a.conversation.lastMessageAt));
}

export async function getMessages(tenantId: string, conversationId: string) {
  const data = getTenantStore(tenantId);
  return data.messages
    .filter((item) => item.conversationId === conversationId)
    .sort((a, b) => +new Date(a.sentAt) - +new Date(b.sentAt));
}

export async function sendMessage(
  tenantId: string,
  input: {
    conversationId: string;
    body: string;
    type: Message["type"];
    agentId: string;
    quotedMessageId?: string;
  },
) {
  const data = getTenantStore(tenantId);
  const conversation = data.conversations.find((item) => item.id === input.conversationId);

  if (!conversation) {
    throw new Error("Conversa não encontrada");
  }

  const message: Message = {
    id: newId("msg"),
    tenantId,
    conversationId: input.conversationId,
    contactId: conversation.contactId,
    agentId: input.agentId,
    body: input.body,
    type: input.type,
    fromMe: true,
    sentAt: new Date().toISOString(),
    deliveredAt: new Date().toISOString(),
    quotedMessageId: input.quotedMessageId,
    favorited: false,
    attachments: [],
  };

  data.messages.push(message);
  conversation.lastMessagePreview = message.body;
  conversation.lastMessageAt = message.sentAt;

  const connection = data.connections.find((item) => item.id === conversation.connectionId);
  if (connection) {
    connection.sentCount += 1;
  }

  publishEvent("w7-whatsapp", {
    tenantId,
    event: "message_created",
    payload: message,
  });

  return message;
}

export async function addConnection(
  tenantId: string,
  input: {
    name: string;
    mode: WhatsAppConnection["mode"];
    phoneNumber: string;
    autoReconnect: boolean;
  },
) {
  const data = getTenantStore(tenantId);
  const connection: WhatsAppConnection = {
    id: newId("cn"),
    tenantId,
    name: input.name,
    mode: input.mode,
    phoneNumber: input.phoneNumber,
    status: "connecting",
    qrCode: input.mode === "qr_device" ? `otpauth://totp/W7?secret=${newId("qr")}` : null,
    healthy: false,
    autoReconnect: input.autoReconnect,
    lastSyncAt: new Date().toISOString(),
    conversationCount: 0,
    sentCount: 0,
    receivedCount: 0,
  };

  data.connections.unshift(connection);

  publishEvent("w7-whatsapp", {
    tenantId,
    event: "connection_updated",
    payload: connection,
  });

  return connection;
}

export async function setConnectionStatus(
  tenantId: string,
  connectionId: string,
  status: WhatsAppConnection["status"],
) {
  const data = getTenantStore(tenantId);
  const connection = data.connections.find((item) => item.id === connectionId);

  if (!connection) {
    return null;
  }

  connection.status = status;
  connection.healthy = makeStatusHealth(status);
  connection.lastSyncAt = new Date().toISOString();
  connection.qrCode = status === "connecting" && connection.mode === "qr_device"
    ? `otpauth://totp/W7?secret=${newId("qr")}`
    : connection.qrCode;

  publishEvent("w7-whatsapp", {
    tenantId,
    event: "connection_updated",
    payload: connection,
  });

  return connection;
}

export async function renameConnection(tenantId: string, connectionId: string, name: string) {
  const data = getTenantStore(tenantId);
  const connection = data.connections.find((item) => item.id === connectionId);

  if (!connection) {
    return null;
  }

  connection.name = name;
  connection.lastSyncAt = new Date().toISOString();

  publishEvent("w7-whatsapp", {
    tenantId,
    event: "connection_updated",
    payload: connection,
  });

  return connection;
}

export async function deleteConnection(tenantId: string, connectionId: string) {
  const data = getTenantStore(tenantId);
  const index = data.connections.findIndex((item) => item.id === connectionId);
  if (index === -1) {
    return false;
  }

  data.connections.splice(index, 1);
  publishEvent("w7-whatsapp", {
    tenantId,
    event: "connection_deleted",
    payload: { connectionId },
  });

  return true;
}

export async function addInternalNote(
  tenantId: string,
  input: { conversationId: string; body: string; agentId: string },
) {
  const data = getTenantStore(tenantId);
  const note: InternalNote = {
    id: newId("note"),
    tenantId,
    conversationId: input.conversationId,
    body: input.body,
    agentId: input.agentId,
    createdAt: new Date().toISOString(),
  };

  data.notes.unshift(note);

  const logEntry: ConversationActionLog = {
    id: newId("log"),
    tenantId,
    conversationId: input.conversationId,
    action: "note",
    actorAgentId: input.agentId,
    metadata: { preview: input.body.slice(0, 40) },
    createdAt: new Date().toISOString(),
  };

  data.logs.unshift(logEntry);

  publishEvent("w7-whatsapp", {
    tenantId,
    event: "note_created",
    payload: note,
  });

  return note;
}

export async function updateConversation(
  tenantId: string,
  conversationId: string,
  changes: {
    assignedAgentId?: string;
    queueId?: string;
    departmentId?: string;
    priority?: ConversationPriority;
    status?: ConversationStatus;
    labelIds?: string[];
  },
  actorAgentId: string,
) {
  const data = getTenantStore(tenantId);
  const conversation = data.conversations.find((item) => item.id === conversationId);

  if (!conversation) {
    return null;
  }

  Object.assign(conversation, changes);

  const action = (() => {
    if (changes.assignedAgentId) return "transfer";
    if (changes.status === "closed") return "close";
    if (changes.status === "in_progress") return "take";
    if (changes.status === "new") return "reopen";
    if (changes.priority) return "set_priority";
    if (changes.departmentId) return "set_department";
    if (changes.labelIds) return "set_labels";
    return "set_priority";
  })();

  const logEntry: ConversationActionLog = {
    id: newId("log"),
    tenantId,
    conversationId,
    action,
    actorAgentId,
    metadata: Object.fromEntries(
      Object.entries(changes).map(([key, value]) => [key, String(value ?? "")]),
    ),
    createdAt: new Date().toISOString(),
  };

  data.logs.unshift(logEntry);

  publishEvent("w7-whatsapp", {
    tenantId,
    event: "conversation_updated",
    payload: conversation,
  });

  return conversation;
}

export async function toggleFavoriteMessage(tenantId: string, messageId: string) {
  const data = getTenantStore(tenantId);
  const message = data.messages.find((item) => item.id === messageId);

  if (!message) {
    return null;
  }

  message.favorited = !message.favorited;
  publishEvent("w7-whatsapp", {
    tenantId,
    event: "message_updated",
    payload: message,
  });

  return message;
}

export async function createScheduledMessage(
  tenantId: string,
  input: {
    body: string;
    type: "once" | "recurring";
    scheduleAt: string;
    recurrenceRule?: string;
    conversationId?: string;
    contactId?: string;
    createdByAgentId: string;
  },
) {
  const data = getTenantStore(tenantId);

  const scheduled = {
    id: newId("sch"),
    tenantId,
    status: "scheduled" as const,
    ...input,
  };

  data.scheduledMessages.unshift(scheduled);

  publishEvent("w7-whatsapp", {
    tenantId,
    event: "scheduled_message_created",
    payload: scheduled,
  });

  return scheduled;
}

export async function deleteScheduledMessage(tenantId: string, scheduledMessageId: string) {
  const data = getTenantStore(tenantId);
  const found = data.scheduledMessages.find((item) => item.id === scheduledMessageId);
  if (!found) {
    return false;
  }

  found.status = "cancelled";
  publishEvent("w7-whatsapp", {
    tenantId,
    event: "scheduled_message_updated",
    payload: found,
  });

  return true;
}

export async function searchMessages(tenantId: string, query: string) {
  const data = getTenantStore(tenantId);
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return [];
  }

  return data.messages.filter((item) => item.body.toLowerCase().includes(normalized));
}

export async function triggerMockIncomingMessage(tenantId: string, conversationId: string) {
  const data = getTenantStore(tenantId);
  const conversation = data.conversations.find((item) => item.id === conversationId);

  if (!conversation) {
    return null;
  }

  const incoming: Message = {
    id: newId("msg"),
    tenantId,
    conversationId,
    contactId: conversation.contactId,
    body: "Mensagem automática de simulação realtime para validar painel.",
    type: "text",
    fromMe: false,
    sentAt: new Date().toISOString(),
    favorited: false,
    attachments: [],
  };

  data.messages.push(incoming);
  conversation.unreadCount += 1;
  conversation.lastMessagePreview = incoming.body;
  conversation.lastMessageAt = incoming.sentAt;

  const connection = data.connections.find((item) => item.id === conversation.connectionId);
  if (connection) {
    connection.receivedCount += 1;
  }

  publishEvent("w7-whatsapp", {
    tenantId,
    event: "message_created",
    payload: incoming,
  });

  return incoming;
}
