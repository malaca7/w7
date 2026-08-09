import type {
  ConversationPriority,
  ConversationStatus,
  TenantRole,
} from "@/modules/whatsapp/types";

export const ROLE_LABEL: Record<TenantRole, string> = {
  super_admin: "Super Admin",
  admin: "Administrador",
  supervisor: "Supervisor",
  agent: "Atendente",
};

export const STATUS_LABEL: Record<ConversationStatus, string> = {
  new: "Novo",
  pending: "Aguardando",
  in_progress: "Em atendimento",
  paused: "Pausado",
  closed: "Finalizado",
  archived: "Arquivado",
};

export const PRIORITY_LABEL: Record<ConversationPriority, string> = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  critical: "Crítica",
};

export const FILTER_STATUS: Array<{
  value: ConversationStatus | "all";
  label: string;
}> = [
  { value: "all", label: "Todos" },
  { value: "new", label: "Novo" },
  { value: "pending", label: "Aguardando" },
  { value: "in_progress", label: "Em atendimento" },
  { value: "paused", label: "Pausado" },
  { value: "closed", label: "Finalizado" },
  { value: "archived", label: "Arquivado" },
];

export function statusColor(status: ConversationStatus) {
  if (status === "new") return "text-[#A6FF00]";
  if (status === "pending") return "text-[#FFD166]";
  if (status === "in_progress") return "text-[#4ADE80]";
  if (status === "paused") return "text-[#F59E0B]";
  if (status === "closed") return "text-[#94A3B8]";
  return "text-[#64748B]";
}

export function connectionStatusColor(
  status: "online" | "offline" | "connecting" | "error",
) {
  if (status === "online") return "bg-emerald-400";
  if (status === "connecting") return "bg-amber-400";
  if (status === "error") return "bg-rose-500";
  return "bg-slate-500";
}

export const EMOJI_CATEGORIES: Record<string, string[]> = {
  "Mais usados": [
    "😊", "😂", "❤️", "👍", "🙏", "🔥", "✅", "⭐", "🎉", "💯",
    "😍", "🤔", "👏", "💪", "😎", "🙌", "💡", "📌", "🚀", "✨",
  ],
  Pessoas: [
    "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "😊",
    "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "🥲", "😋",
    "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🫢", "🫣", "🤫",
    "🤔", "🫡", "🤐", "🤨", "😐", "😑", "😶", "🫥", "😏", "😒",
    "🙄", "😬", "🤥", "🫠", "😌", "😔", "😪", "🤤", "😴", "😷",
  ],
  Mãos: [
    "👋", "🤚", "🖐️", "✋", "🖖", "🫱", "🫲", "🫳", "🫴", "👌",
    "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👈", "👉",
    "👆", "🖕", "👇", "☝️", "🫵", "👍", "👎", "✊", "👊", "🤛",
    "🤜", "👏", "🙌", "🫶", "👐", "🤲", "🤝", "🙏", "💪", "🦾",
  ],
  Objetos: [
    "💼", "📁", "📂", "📊", "📈", "📉", "📋", "📝", "✏️", "📎",
    "📌", "📍", "📐", "📏", "🔗", "💻", "🖥️", "📱", "☎️", "📞",
    "📧", "📨", "📩", "📤", "📥", "📦", "🏷️", "💳", "💰", "💵",
  ],
  Símbolos: [
    "✅", "❌", "⭕", "❗", "❓", "‼️", "⁉️", "💯", "🔴", "🟠",
    "🟡", "🟢", "🔵", "🟣", "⚫", "⚪", "🟤", "🔶", "🔷", "🔸",
    "🔹", "▪️", "▫️", "◾", "◽", "🏁", "🚩", "🏳️", "⭐", "🌟",
  ],
};

export const SIDEBAR_ITEMS = [
  { value: "dashboard", label: "Dashboard", iconName: "Gauge" },
  { value: "connections", label: "Conexões", iconName: "Wifi" },
  { value: "inbox", label: "Inbox", iconName: "Inbox" },
  { value: "crm", label: "CRM", iconName: "Building2" },
  { value: "queues", label: "Filas", iconName: "Headset" },
  { value: "automations", label: "Automações", iconName: "Bot" },
  { value: "permissions", label: "Permissões", iconName: "ShieldCheck" },
] as const;
