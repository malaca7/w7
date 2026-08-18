import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type UserRole = "owner" | "admin" | "supervisor" | "attendant";
export type PlanType = "trial" | "starter" | "pro" | "enterprise";
export type ConnectionMode = "qr_device" | "meta_api";
export type ConnectionStatus = "online" | "offline" | "connecting" | "error";
export type ConversationStatus = "open" | "pending" | "resolved" | "archived";
export type ConversationPriority = "low" | "normal" | "high" | "critical";
export type MessageType = "text" | "audio" | "image" | "video" | "document" | "location" | "contact" | "system";
export type AutomationType = "welcome" | "away" | "off_hours" | "closing" | "csat" | "auto_reply" | "department_route";
export type AIAction = "auto_reply" | "suggestion" | "classify" | "sentiment" | "summary" | "intent" | "route";

export interface Company {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  plan: PlanType;
  plan_status: string;
  trial_ends_at: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  company_id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  department_id: string | null;
  is_active: boolean;
  last_seen_at: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppConnection {
  id: string;
  company_id: string;
  name: string;
  mode: ConnectionMode;
  status: ConnectionStatus;
  qr_code: string | null;
  device_name: string | null;
  phone_number: string | null;
  profile_photo_url: string | null;
  profile_name: string | null;
  battery: number | null;
  healthy: boolean;
  auto_reconnect: boolean;
  last_sync_at: string | null;
  conversation_count: number;
  sent_count: number;
  received_count: number;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  company_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  avatar_url: string | null;
  tags: string[];
  notes: string | null;
  stage: string;
  assigned_to: string | null;
  metadata: Record<string, unknown>;
  company_name: string | null;
  cpf_cnpj: string | null;
  city: string | null;
  state: string | null;
  custom_fields: Record<string, unknown>;
  last_interaction_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  company_id: string;
  contact_id: string | null;
  connection_id: string | null;
  assigned_to: string | null;
  department_id: string | null;
  status: ConversationStatus;
  channel: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  tags: string[];
  metadata: Record<string, unknown>;
  priority: ConversationPriority;
  queue_id: string | null;
  ai_sentiment: string | null;
  ai_summary: string | null;
  created_at: string;
  updated_at: string;
  // joined
  contacts?: Contact | null;
  profiles?: Profile | null;
  departments?: { id: string; name: string; color: string } | null;
}

export interface WhatsAppMessage {
  id: string;
  company_id: string;
  conversation_id: string;
  contact_id: string | null;
  sender_id: string | null;
  body: string;
  type: MessageType;
  from_me: boolean;
  sent_at: string;
  delivered_at: string | null;
  read_at: string | null;
  quoted_message_id: string | null;
  favorited: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  // joined
  quoted_message?: WhatsAppMessage | null;
  attachments?: WhatsAppAttachment[];
  sender?: Profile | null;
}

export interface WhatsAppAttachment {
  id: string;
  company_id: string;
  message_id: string;
  kind: string;
  url: string;
  mime_type: string | null;
  file_name: string | null;
  size_bytes: number | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface WhatsAppLabel {
  id: string;
  company_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppNote {
  id: string;
  company_id: string;
  conversation_id: string;
  author_id: string;
  body: string;
  created_at: string;
  // joined
  author?: Profile | null;
}

export interface WhatsAppQuickReply {
  id: string;
  company_id: string;
  shortcut: string;
  title: string;
  body: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppAutomation {
  id: string;
  company_id: string;
  type: AutomationType;
  active: boolean;
  name: string;
  trigger_keywords: string[];
  target_department_id: string | null;
  message_template: string;
  conditions: Record<string, unknown>;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppBusinessHour {
  id: string;
  company_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

export interface WhatsAppQueue {
  id: string;
  company_id: string;
  name: string;
  color: string;
  priority: number;
  auto_assign: boolean;
  max_per_agent: number;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
  created_at: string;
}

export interface AIConfig {
  id: string;
  company_id: string;
  enabled: boolean;
  auto_reply: boolean;
  personality: string;
  instructions: string;
  context: string;
  model: string;
  temperature: number;
  max_tokens: number;
  auto_transfer_threshold: number;
  transfer_message: string;
  created_at: string;
  updated_at: string;
}

export interface AIKnowledgeBase {
  id: string;
  company_id: string;
  title: string;
  content: string;
  category: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIUsageLog {
  id: string;
  company_id: string;
  conversation_id: string | null;
  action: AIAction;
  input_tokens: number;
  output_tokens: number;
  model: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface WhatsAppLog {
  id: string;
  company_id: string;
  conversation_id: string | null;
  actor_id: string | null;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
  // joined
  actor?: Profile | null;
}

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (_client) return _client;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  _client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: "w7-auth",
    },
  });

  return _client;
}

export function requireSupabase(): SupabaseClient {
  const client = getSupabase();
  if (!client) throw new Error("Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env");
  return client;
}
