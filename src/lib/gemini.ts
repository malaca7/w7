import { requireSupabase } from "./supabase";
import type { AIConfig, AIKnowledgeBase, AIUsageLog } from "./supabase";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

interface GeminiResponse {
  reply: string;
  sentiment?: string;
  intent?: string;
  confidence?: number;
  shouldTransfer?: boolean;
  suggestedDepartment?: string;
}

function buildSystemPrompt(config: AIConfig, knowledgeBase: string): string {
  return `Você é um assistente de atendimento ao cliente via WhatsApp.

PERSONALIDADE: ${config.personality}

INSTRUÇÕES: ${config.instructions}

CONTEXTO DA EMPRESA: ${config.context}

BASE DE CONHECIMENTO:
${knowledgeBase}

REGRAS:
1. Responda sempre em português brasileiro.
2. Seja objetivo e profissional.
3. Se não souber a resposta, indique que vai transferir para um atendente humano.
4. Classifique o sentimento da mensagem (positivo, neutro, negativo).
5. Identifique a intenção principal (dúvida, reclamação, compra, suporte, etc).
6. Retorne sua resposta no formato JSON: { "reply": "...", "sentiment": "...", "intent": "...", "confidence": 0.0-1.0, "shouldTransfer": false, "suggestedDepartment": "" }`;
}

async function callGemini(model: string, systemPrompt: string, messages: { role: string; text: string }[], temperature: number, maxTokens: number): Promise<GeminiResponse> {
  const contents = [
    { role: "user", parts: [{ text: systemPrompt }] },
    ...messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }],
    })),
  ];

  const res = await fetch(`${GEMINI_API_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Gemini API error:", errText);
    throw new Error(`Gemini API error: ${res.status}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

  try {
    const parsed = JSON.parse(text);
    return {
      reply: parsed.reply ?? "",
      sentiment: parsed.sentiment,
      intent: parsed.intent,
      confidence: parsed.confidence,
      shouldTransfer: parsed.shouldTransfer ?? false,
      suggestedDepartment: parsed.suggestedDepartment,
    };
  } catch {
    return { reply: text, sentiment: "neutro", confidence: 0.5 };
  }
}

// ── AI Config ─────────────────────────────────────────────

export async function fetchAIConfig(companyId: string): Promise<AIConfig | null> {
  const sb = requireSupabase();
  const { data } = await sb
    .from("ai_configs")
    .select("*")
    .eq("company_id", companyId)
    .single();
  return data as AIConfig | null;
}

export async function upsertAIConfig(companyId: string, config: Partial<AIConfig>) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("ai_configs")
    .upsert({ company_id: companyId, ...config }, { onConflict: "company_id" })
    .select()
    .single();
  if (error) throw error;
  return data as AIConfig;
}

// ── Knowledge Base ────────────────────────────────────────

export async function fetchKnowledgeBase(companyId: string) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("ai_knowledge_base")
    .select("*")
    .eq("company_id", companyId)
    .eq("active", true)
    .order("category");
  if (error) throw error;
  return (data ?? []) as AIKnowledgeBase[];
}

export async function upsertKnowledgeEntry(companyId: string, entry: Partial<AIKnowledgeBase> & { title: string; content: string }) {
  const sb = requireSupabase();
  const payload = { company_id: companyId, ...entry };
  const { data, error } = entry.id
    ? await sb.from("ai_knowledge_base").update(payload).eq("id", entry.id).select().single()
    : await sb.from("ai_knowledge_base").insert(payload).select().single();
  if (error) throw error;
  return data as AIKnowledgeBase;
}

export async function deleteKnowledgeEntry(id: string) {
  const sb = requireSupabase();
  const { error } = await sb.from("ai_knowledge_base").update({ active: false }).eq("id", id);
  if (error) throw error;
}

// ── AI Usage ──────────────────────────────────────────────

export async function fetchAIUsage(companyId: string, limit = 50) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("ai_usage_logs")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as AIUsageLog[];
}

export async function fetchAIUsageStats(companyId: string) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("ai_usage_logs")
    .select("action, input_tokens, output_tokens")
    .eq("company_id", companyId);
  if (error) throw error;

  const logs = data ?? [];
  const totalTokens = logs.reduce((acc, l) => acc + (l.input_tokens ?? 0) + (l.output_tokens ?? 0), 0);
  const byAction: Record<string, number> = {};
  for (const l of logs) {
    byAction[l.action] = (byAction[l.action] ?? 0) + 1;
  }

  return { totalInteractions: logs.length, totalTokens, byAction };
}

async function logAIUsage(companyId: string, action: string, conversationId: string | undefined, inputTokens: number, outputTokens: number, model: string) {
  const sb = requireSupabase();
  await sb.from("ai_usage_logs").insert({
    company_id: companyId,
    conversation_id: conversationId,
    action,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    model,
  });
}

// ── High-level AI Functions ──────────────────────────────

export async function suggestReply(companyId: string, conversationId: string, recentMessages: { role: string; text: string }[]): Promise<GeminiResponse> {
  const config = await fetchAIConfig(companyId);
  if (!config?.enabled) throw new Error("IA não habilitada para esta empresa");

  const kb = await fetchKnowledgeBase(companyId);
  const kbText = kb.map((e) => `[${e.category}] ${e.title}: ${e.content}`).join("\n");

  const systemPrompt = buildSystemPrompt(config, kbText);
  const result = await callGemini(config.model, systemPrompt, recentMessages, config.temperature, config.max_tokens);

  await logAIUsage(companyId, "suggestion", conversationId, recentMessages.length * 50, result.reply.length, config.model);

  return result;
}

export async function classifyMessage(companyId: string, message: string): Promise<{ sentiment: string; intent: string; confidence: number }> {
  const config = await fetchAIConfig(companyId);
  const model = config?.model ?? "gemini-2.0-flash";

  const systemPrompt = `Classifique a mensagem a seguir. Retorne JSON com: { "sentiment": "positivo|neutro|negativo", "intent": "dúvida|reclamação|compra|suporte|saudação|agradecimento|outro", "confidence": 0.0-1.0 }`;

  const result = await callGemini(model, systemPrompt, [{ role: "user", text: message }], 0.3, 256);

  await logAIUsage(companyId, "classify", undefined, message.length, 100, model);

  return {
    sentiment: result.sentiment ?? "neutro",
    intent: result.intent ?? "outro",
    confidence: result.confidence ?? 0.5,
  };
}

export async function summarizeConversation(companyId: string, conversationId: string, messages: { role: string; text: string }[]): Promise<string> {
  const config = await fetchAIConfig(companyId);
  const model = config?.model ?? "gemini-2.0-flash";

  const systemPrompt = `Resuma a seguinte conversa de atendimento em 2-3 frases concisas em português. Retorne JSON: { "reply": "resumo aqui" }`;

  const result = await callGemini(model, systemPrompt, messages, 0.3, 512);

  await logAIUsage(companyId, "summary", conversationId, messages.length * 50, result.reply.length, model);

  return result.reply;
}

export async function analyzeSentiment(companyId: string, message: string): Promise<string> {
  const result = await classifyMessage(companyId, message);
  return result.sentiment;
}

export async function autoReply(companyId: string, conversationId: string, incomingMessage: string, history: { role: string; text: string }[]): Promise<GeminiResponse> {
  const config = await fetchAIConfig(companyId);
  if (!config?.enabled || !config?.auto_reply) throw new Error("Resposta automática desabilitada");

  const kb = await fetchKnowledgeBase(companyId);
  const kbText = kb.map((e) => `[${e.category}] ${e.title}: ${e.content}`).join("\n");

  const systemPrompt = buildSystemPrompt(config, kbText) + `\n\nEsta é uma resposta AUTOMÁTICA. Seja especialmente claro e prestativo.`;

  const allMessages = [...history, { role: "user", text: incomingMessage }];
  const result = await callGemini(config.model, systemPrompt, allMessages, config.temperature, config.max_tokens);

  await logAIUsage(companyId, "auto_reply", conversationId, allMessages.length * 50, result.reply.length, config.model);

  // Check if should transfer
  if (result.shouldTransfer || (result.confidence != null && result.confidence < config.auto_transfer_threshold)) {
    result.shouldTransfer = true;
    result.reply = config.transfer_message;
  }

  return result;
}
