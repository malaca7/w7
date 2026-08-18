import { getSupabase, requireSupabase } from "./supabase";
import type {
  WhatsAppConnection,
  WhatsAppMessage,
  WhatsAppAttachment,
  WhatsAppLabel,
  WhatsAppNote,
  WhatsAppQuickReply,
  WhatsAppAutomation,
  WhatsAppBusinessHour,
  WhatsAppQueue,
  WhatsAppLog,
  Conversation,
  Contact,
  ConversationStatus,
  ConversationPriority,
  MessageType,
  ConnectionStatus,
  Profile,
} from "./supabase";

// ── Connections ───────────────────────────────────────────

const LOCAL_CONN_KEY = "w7_connections_local";

function getLocalConns(companyId: string): WhatsAppConnection[] {
  try {
    const item = localStorage.getItem(`${LOCAL_CONN_KEY}_${companyId}`);
    return item ? JSON.parse(item) : [];
  } catch {
    return [];
  }
}

function saveLocalConns(companyId: string, conns: WhatsAppConnection[]) {
  try {
    localStorage.setItem(`${LOCAL_CONN_KEY}_${companyId}`, JSON.stringify(conns));
  } catch {
    // ignore
  }
}

export async function fetchConnections(companyId: string) {
  const sb = getSupabase();
  if (!sb || !companyId) return getLocalConns(companyId || "default");

  try {
    const { data, error } = await sb
      .from("whatsapp_connections")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "42P01" || error.message.includes("does not exist")) {
        return getLocalConns(companyId);
      }
      throw error;
    }
    return (data ?? []) as WhatsAppConnection[];
  } catch {
    return getLocalConns(companyId);
  }
}

export async function createConnection(companyId: string, input: {
  name: string;
  mode: string;
  phone_number?: string;
  auto_reconnect?: boolean;
}) {
  const cid = companyId || "default";
  const sb = getSupabase();

  const newConn: WhatsAppConnection = {
    id: crypto.randomUUID(),
    company_id: cid,
    name: input.name,
    mode: (input.mode as any) ?? "qr_device",
    status: "connecting",
    qr_code: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%23eee'/></svg>",
    device_name: "Chrome (Windows)",
    phone_number: input.phone_number || "+55 11 99999-0000",
    profile_photo_url: null,
    profile_name: input.name,
    battery: 98,
    healthy: true,
    auto_reconnect: input.auto_reconnect ?? true,
    last_sync_at: new Date().toISOString(),
    conversation_count: 0,
    sent_count: 0,
    received_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (sb && companyId) {
    try {
      const { data, error } = await sb
        .from("whatsapp_connections")
        .insert({
          company_id: companyId,
          name: input.name,
          mode: input.mode,
          phone_number: input.phone_number,
          auto_reconnect: input.auto_reconnect ?? true,
          status: "connecting",
        })
        .select()
        .single();

      if (!error && data) {
        return data as WhatsAppConnection;
      }
    } catch {
      // fallback below
    }
  }

  // Fallback to local storage if DB table isn't created yet
  const local = getLocalConns(cid);
  local.unshift(newConn);
  saveLocalConns(cid, local);
  return newConn;
}

export async function updateConnectionStatus(id: string, status: ConnectionStatus) {
  const sb = getSupabase();
  const healthy = status === "online";

  if (sb) {
    try {
      const { data, error } = await sb
        .from("whatsapp_connections")
        .update({ status, healthy, last_sync_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (!error && data) return data as WhatsAppConnection;
    } catch {
      // fallback
    }
  }

  return { id, status, healthy } as any;
}

export async function deleteConnection(id: string) {
  const sb = getSupabase();
  if (sb) {
    try {
      await sb.from("whatsapp_connections").delete().eq("id", id);
    } catch {
      // fallback
    }
  }
}

// ── Conversations ─────────────────────────────────────────

export async function fetchConversations(companyId: string, filters?: {
  status?: string;
  channel?: string;
  departmentId?: string;
  assignedTo?: string;
  search?: string;
  limit?: number;
}) {
  const sb = requireSupabase();
  let q = sb
    .from("conversations")
    .select("*, contacts(id, name, phone, whatsapp, avatar_url, tags, stage), profiles:assigned_to(id, full_name, avatar_url), departments(id, name, color)")
    .eq("company_id", companyId)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(filters?.limit ?? 100);

  if (filters?.status && filters.status !== "all") q = q.eq("status", filters.status);
  if (filters?.channel && filters.channel !== "all") q = q.eq("channel", filters.channel);
  if (filters?.departmentId) q = q.eq("department_id", filters.departmentId);
  if (filters?.assignedTo) q = q.eq("assigned_to", filters.assignedTo);

  const { data, error } = await q;
  if (error) throw error;

  let result = (data ?? []) as Conversation[];

  if (filters?.search) {
    const s = filters.search.toLowerCase();
    result = result.filter((c) =>
      (c.contacts?.name ?? "").toLowerCase().includes(s) ||
      (c.contacts?.phone ?? "").includes(s) ||
      (c.last_message ?? "").toLowerCase().includes(s)
    );
  }

  return result;
}

export async function updateConversation(id: string, updates: {
  status?: ConversationStatus;
  priority?: ConversationPriority;
  assigned_to?: string | null;
  department_id?: string | null;
  queue_id?: string | null;
  tags?: string[];
  ai_sentiment?: string;
  ai_summary?: string;
}) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("conversations")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, contacts(id, name, phone, whatsapp, avatar_url, tags, stage), profiles:assigned_to(id, full_name, avatar_url), departments(id, name, color)")
    .single();
  if (error) throw error;
  return data as Conversation;
}

export async function createConversation(companyId: string, input: {
  contact_id: string;
  connection_id?: string;
  channel?: string;
  department_id?: string;
  assigned_to?: string;
}) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("conversations")
    .insert({ company_id: companyId, status: "open", ...input })
    .select("*, contacts(id, name, phone, whatsapp, avatar_url, tags, stage)")
    .single();
  if (error) throw error;
  return data as Conversation;
}

// ── Messages ──────────────────────────────────────────────

export async function fetchMessages(companyId: string, conversationId: string, limit = 100) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("whatsapp_messages")
    .select("*, sender:sender_id(id, full_name, avatar_url), whatsapp_attachments(*)")
    .eq("company_id", companyId)
    .eq("conversation_id", conversationId)
    .order("sent_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((m: any) => ({
    ...m,
    attachments: m.whatsapp_attachments ?? [],
  })) as WhatsAppMessage[];
}

export async function sendMessage(companyId: string, input: {
  conversation_id: string;
  body: string;
  type?: MessageType;
  sender_id: string;
  contact_id?: string;
  quoted_message_id?: string;
}) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("whatsapp_messages")
    .insert({
      company_id: companyId,
      conversation_id: input.conversation_id,
      body: input.body,
      type: input.type ?? "text",
      from_me: true,
      sender_id: input.sender_id,
      contact_id: input.contact_id,
      quoted_message_id: input.quoted_message_id,
      sent_at: new Date().toISOString(),
      delivered_at: new Date().toISOString(),
    })
    .select("*, sender:sender_id(id, full_name, avatar_url)")
    .single();
  if (error) throw error;

  // Update conversation last_message
  await sb.from("conversations").update({
    last_message: input.body,
    last_message_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", input.conversation_id);

  return data as WhatsAppMessage;
}

export async function toggleFavorite(messageId: string, currentValue: boolean) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("whatsapp_messages")
    .update({ favorited: !currentValue })
    .eq("id", messageId)
    .select()
    .single();
  if (error) throw error;
  return data as WhatsAppMessage;
}

export async function searchMessages(companyId: string, query: string) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("whatsapp_messages")
    .select("*, sender:sender_id(id, full_name, avatar_url)")
    .eq("company_id", companyId)
    .ilike("body", `%${query}%`)
    .order("sent_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as WhatsAppMessage[];
}

// ── Notes ─────────────────────────────────────────────────

export async function fetchNotes(companyId: string, conversationId: string) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("whatsapp_notes")
    .select("*, author:author_id(id, full_name, avatar_url)")
    .eq("company_id", companyId)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as WhatsAppNote[];
}

export async function addNote(companyId: string, input: {
  conversation_id: string;
  author_id: string;
  body: string;
}) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("whatsapp_notes")
    .insert({ company_id: companyId, ...input })
    .select("*, author:author_id(id, full_name, avatar_url)")
    .single();
  if (error) throw error;
  return data as WhatsAppNote;
}

// ── Labels ────────────────────────────────────────────────

export async function fetchLabels(companyId: string) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("whatsapp_labels")
    .select("*")
    .eq("company_id", companyId)
    .order("name");
  if (error) throw error;
  return (data ?? []) as WhatsAppLabel[];
}

export async function createLabel(companyId: string, name: string, color: string) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("whatsapp_labels")
    .insert({ company_id: companyId, name, color })
    .select()
    .single();
  if (error) throw error;
  return data as WhatsAppLabel;
}

export async function deleteLabel(id: string) {
  const sb = requireSupabase();
  const { error } = await sb.from("whatsapp_labels").delete().eq("id", id);
  if (error) throw error;
}

// ── Quick Replies ─────────────────────────────────────────

export async function fetchQuickReplies(companyId: string) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("whatsapp_quick_replies")
    .select("*")
    .eq("company_id", companyId)
    .eq("active", true)
    .order("shortcut");
  if (error) throw error;
  return (data ?? []) as WhatsAppQuickReply[];
}

export async function createQuickReply(companyId: string, input: {
  shortcut: string;
  title: string;
  body: string;
}) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("whatsapp_quick_replies")
    .insert({ company_id: companyId, ...input })
    .select()
    .single();
  if (error) throw error;
  return data as WhatsAppQuickReply;
}

export async function deleteQuickReply(id: string) {
  const sb = requireSupabase();
  const { error } = await sb.from("whatsapp_quick_replies").update({ active: false }).eq("id", id);
  if (error) throw error;
}

// ── Automations ───────────────────────────────────────────

export async function fetchAutomations(companyId: string) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("whatsapp_automations")
    .select("*")
    .eq("company_id", companyId)
    .order("priority", { ascending: false });
  if (error) throw error;
  return (data ?? []) as WhatsAppAutomation[];
}

export async function upsertAutomation(companyId: string, input: Partial<WhatsAppAutomation> & { name: string; type: string; message_template: string }) {
  const sb = requireSupabase();
  const payload = { company_id: companyId, ...input };
  const { data, error } = input.id
    ? await sb.from("whatsapp_automations").update(payload).eq("id", input.id).select().single()
    : await sb.from("whatsapp_automations").insert(payload).select().single();
  if (error) throw error;
  return data as WhatsAppAutomation;
}

export async function deleteAutomation(id: string) {
  const sb = requireSupabase();
  const { error } = await sb.from("whatsapp_automations").delete().eq("id", id);
  if (error) throw error;
}

// ── Business Hours ────────────────────────────────────────

export async function fetchBusinessHours(companyId: string) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("whatsapp_business_hours")
    .select("*")
    .eq("company_id", companyId)
    .order("day_of_week");
  if (error) throw error;
  return (data ?? []) as WhatsAppBusinessHour[];
}

export async function upsertBusinessHour(companyId: string, input: {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("whatsapp_business_hours")
    .upsert({ company_id: companyId, ...input }, { onConflict: "company_id,day_of_week" })
    .select()
    .single();
  if (error) throw error;
  return data as WhatsAppBusinessHour;
}

// ── Queues ────────────────────────────────────────────────

export async function fetchQueues(companyId: string) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("whatsapp_queues")
    .select("*")
    .eq("company_id", companyId)
    .order("priority", { ascending: false });
  if (error) throw error;
  return (data ?? []) as WhatsAppQueue[];
}

// ── Contacts (extended) ──────────────────────────────────

export async function fetchContacts(companyId: string, filters?: {
  search?: string;
  stage?: string;
  limit?: number;
}) {
  const sb = requireSupabase();
  let q = sb
    .from("contacts")
    .select("*")
    .eq("company_id", companyId)
    .order("updated_at", { ascending: false })
    .limit(filters?.limit ?? 100);

  if (filters?.stage && filters.stage !== "all") q = q.eq("stage", filters.stage);

  const { data, error } = await q;
  if (error) throw error;

  let result = (data ?? []) as Contact[];
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    result = result.filter((c) =>
      c.name.toLowerCase().includes(s) ||
      (c.phone ?? "").includes(s) ||
      (c.email ?? "").toLowerCase().includes(s)
    );
  }
  return result;
}

export async function upsertContact(companyId: string, contact: Partial<Contact> & { name: string }) {
  const sb = requireSupabase();
  const payload = { company_id: companyId, ...contact };
  const { data, error } = contact.id
    ? await sb.from("contacts").update(payload).eq("id", contact.id).select().single()
    : await sb.from("contacts").insert(payload).select().single();
  if (error) throw error;
  return data as Contact;
}

// ── Departments ───────────────────────────────────────────

export async function fetchDepartments(companyId: string) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("departments")
    .select("*")
    .eq("company_id", companyId)
    .order("name");
  if (error) throw error;
  return (data ?? []) as import("./supabase").Department[];
}

// ── Profiles (team members) ──────────────────────────────

export async function fetchTeamMembers(companyId: string) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("full_name");
  if (error) throw error;
  return (data ?? []) as Profile[];
}

// ── Logs ──────────────────────────────────────────────────

export async function addLog(companyId: string, input: {
  conversation_id?: string;
  actor_id?: string;
  action: string;
  metadata?: Record<string, unknown>;
}) {
  const sb = requireSupabase();
  await sb.from("whatsapp_logs").insert({ company_id: companyId, ...input });
}

export async function fetchLogs(companyId: string, conversationId?: string, limit = 50) {
  const sb = requireSupabase();
  let q = sb
    .from("whatsapp_logs")
    .select("*, actor:actor_id(id, full_name, avatar_url)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (conversationId) q = q.eq("conversation_id", conversationId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as WhatsAppLog[];
}

// ── Dashboard Stats ──────────────────────────────────────

export async function fetchDashboardStats(companyId: string) {
  const sb = requireSupabase();

  const [convOpen, convPending, convResolved, convTotal, contactsTotal, connectionsTotal] = await Promise.all([
    sb.from("conversations").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "open"),
    sb.from("conversations").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "pending"),
    sb.from("conversations").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "resolved"),
    sb.from("conversations").select("id", { count: "exact", head: true }).eq("company_id", companyId),
    sb.from("contacts").select("id", { count: "exact", head: true }).eq("company_id", companyId),
    sb.from("whatsapp_connections").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "online"),
  ]);

  // AI usage stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count: aiToday } = await sb
    .from("ai_usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .gte("created_at", today.toISOString());

  // Messages sent/received today
  const { count: sentToday } = await sb
    .from("whatsapp_messages")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("from_me", true)
    .gte("sent_at", today.toISOString());

  const { count: receivedToday } = await sb
    .from("whatsapp_messages")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("from_me", false)
    .gte("sent_at", today.toISOString());

  // Online agents
  const { count: onlineAgents } = await sb
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("is_active", true)
    .not("last_seen_at", "is", null)
    .gte("last_seen_at", new Date(Date.now() - 5 * 60 * 1000).toISOString());

  return {
    open: convOpen.count ?? 0,
    pending: convPending.count ?? 0,
    resolved: convResolved.count ?? 0,
    total: convTotal.count ?? 0,
    contacts: contactsTotal.count ?? 0,
    connections: connectionsTotal.count ?? 0,
    aiUsageToday: aiToday ?? 0,
    sentToday: sentToday ?? 0,
    receivedToday: receivedToday ?? 0,
    onlineAgents: onlineAgents ?? 0,
  };
}
