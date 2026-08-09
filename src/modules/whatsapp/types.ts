export type TenantRole = "super_admin" | "admin" | "supervisor" | "agent";

export type ConnectionMode = "qr_device" | "meta_api";

export type ConnectionStatus = "online" | "offline" | "connecting" | "error";

export type ConversationStatus =
  | "new"
  | "pending"
  | "in_progress"
  | "paused"
  | "closed"
  | "archived";

export type ConversationPriority = "low" | "normal" | "high" | "critical";

export type MessageType =
  | "text"
  | "audio"
  | "image"
  | "video"
  | "document"
  | "pdf"
  | "location"
  | "contact"
  | "system";

export interface Department {
  id: string;
  tenantId: string;
  name: string;
  color: string;
  active: boolean;
}

export interface Queue {
  id: string;
  tenantId: string;
  name: string;
  color: string;
  priority: number;
  businessHours: string;
  autoMessage: string;
  agentIds: string[];
}

export interface Agent {
  id: string;
  tenantId: string;
  name: string;
  avatarUrl?: string;
  role: TenantRole;
  online: boolean;
  departmentIds: string[];
}

export interface Label {
  id: string;
  tenantId: string;
  name: string;
  color: string;
}

export interface WhatsAppConnection {
  id: string;
  tenantId: string;
  name: string;
  mode: ConnectionMode;
  status: ConnectionStatus;
  qrCode: string | null;
  deviceName?: string;
  phoneNumber?: string;
  profilePhotoUrl?: string;
  profileName?: string;
  battery?: number;
  healthy: boolean;
  lastSyncAt: string;
  conversationCount: number;
  sentCount: number;
  receivedCount: number;
  autoReconnect: boolean;
}

export interface Contact {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  city?: string;
  state?: string;
  document?: string;
  avatarUrl?: string;
  tags: string[];
  notes?: string;
  lastConversationAt?: string;
}

export interface Conversation {
  id: string;
  tenantId: string;
  contactId: string;
  connectionId: string;
  channel: "whatsapp" | "meta_api";
  status: ConversationStatus;
  queueId?: string;
  departmentId?: string;
  assignedAgentId?: string;
  priority: ConversationPriority;
  labelIds: string[];
  unreadCount: number;
  lastMessagePreview: string;
  lastMessageAt: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  tenantId: string;
  messageId: string;
  url: string;
  type: Exclude<MessageType, "text" | "system">;
  mimeType: string;
  fileName: string;
  sizeBytes: number;
  durationSeconds?: number;
}

export interface Message {
  id: string;
  tenantId: string;
  conversationId: string;
  contactId: string;
  agentId?: string;
  body: string;
  type: MessageType;
  fromMe: boolean;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  quotedMessageId?: string;
  favorited: boolean;
  attachments: Attachment[];
}

export interface InternalNote {
  id: string;
  tenantId: string;
  conversationId: string;
  agentId: string;
  body: string;
  createdAt: string;
}

export interface ScheduledMessage {
  id: string;
  tenantId: string;
  conversationId?: string;
  contactId?: string;
  body: string;
  type: "once" | "recurring";
  scheduleAt: string;
  recurrenceRule?: string;
  status: "scheduled" | "sent" | "cancelled";
  createdByAgentId: string;
}

export interface Automation {
  id: string;
  tenantId: string;
  type:
    | "welcome"
    | "away"
    | "off_hours"
    | "closing"
    | "csat"
    | "quick_reply"
    | "scheduled";
  active: boolean;
  name: string;
  triggerDescription: string;
  messageTemplate: string;
}

export interface ConversationActionLog {
  id: string;
  tenantId: string;
  conversationId: string;
  action:
    | "take"
    | "transfer"
    | "close"
    | "reopen"
    | "set_priority"
    | "set_department"
    | "set_labels"
    | "note";
  actorAgentId: string;
  metadata: Record<string, string>;
  createdAt: string;
}

export interface DashboardMetrics {
  openConversations: number;
  closedConversations: number;
  avgHandleTimeMinutes: number;
  avgFirstResponseSeconds: number;
  onlineAgents: number;
  activeContacts: number;
  sentMessages: number;
  receivedMessages: number;
  connectedNumbers: number;
}

export interface WhatsAppWorkspaceData {
  connections: WhatsAppConnection[];
  contacts: Contact[];
  conversations: Conversation[];
  messages: Message[];
  departments: Department[];
  queues: Queue[];
  agents: Agent[];
  labels: Label[];
  notes: InternalNote[];
  quickReplies: string[];
  scheduledMessages: ScheduledMessage[];
  automations: Automation[];
  logs: ConversationActionLog[];
  metrics: DashboardMetrics;
}

export interface ConversationView {
  conversation: Conversation;
  contact: Contact;
  agent?: Agent;
  department?: Department;
  queue?: Queue;
  labels: Label[];
}

export interface RealtimeEvent<TPayload> {
  tenantId: string;
  event: string;
  payload: TPayload;
}
