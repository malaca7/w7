import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useConversationRealtime } from "@/hooks/use-realtime";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, Phone, Video, MoreVertical, Sparkles, PanelRightOpen, PanelRightClose, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  toggleFavorite,
  fetchNotes,
  addNote,
  fetchLabels,
  fetchQuickReplies,
  fetchDepartments,
  fetchTeamMembers,
  updateConversation as updateConvDB,
  addLog,
} from "@/lib/whatsapp-db";
import { suggestReply } from "@/lib/gemini";
import { ConversationList } from "@/modules/whatsapp/components/conversation-list";
import { ChatMessageBubble } from "@/modules/whatsapp/components/chat-message-bubble";
import { ChatInput } from "@/modules/whatsapp/components/chat-input";
import { ContactPanel } from "@/modules/whatsapp/components/contact-panel";
import { TypingIndicator } from "@/modules/whatsapp/components/typing-indicator";
import { AISuggestionCard } from "@/modules/whatsapp/components/ai-suggestion-card";
import type { Conversation, WhatsAppMessage } from "@/lib/supabase";

export const Route = createFileRoute("/app/atendimento")({
  component: AtendimentoPage,
});

function AtendimentoPage() {
  const { authUser } = useAuth();
  const companyId = authUser?.company.id;
  const userId = authUser?.user.id;
  const queryClient = useQueryClient();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Realtime subscriptions
  useConversationRealtime(companyId, selectedId ?? undefined);

  // ── Queries ────────────────────────────────────────────

  const { data: conversations = [], isLoading: loadingConvs } = useQuery({
    queryKey: ["conversations", companyId],
    enabled: !!companyId,
    queryFn: () => fetchConversations(companyId!, { limit: 100 }),
    refetchInterval: 30_000,
  });

  const selectedConv = conversations.find((c) => c.id === selectedId);

  const { data: messages = [], isLoading: loadingMsgs } = useQuery({
    queryKey: ["messages", companyId, selectedId],
    enabled: !!companyId && !!selectedId,
    queryFn: () => fetchMessages(companyId!, selectedId!),
  });

  const { data: notes = [] } = useQuery({
    queryKey: ["notes", companyId, selectedId],
    enabled: !!companyId && !!selectedId,
    queryFn: () => fetchNotes(companyId!, selectedId!),
  });

  const { data: labels = [] } = useQuery({
    queryKey: ["labels", companyId],
    enabled: !!companyId,
    queryFn: () => fetchLabels(companyId!),
  });

  const { data: quickReplies = [] } = useQuery({
    queryKey: ["quickReplies", companyId],
    enabled: !!companyId,
    queryFn: () => fetchQuickReplies(companyId!),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments", companyId],
    enabled: !!companyId,
    queryFn: () => fetchDepartments(companyId!),
  });

  const { data: agents = [] } = useQuery({
    queryKey: ["team", companyId],
    enabled: !!companyId,
    queryFn: () => fetchTeamMembers(companyId!),
  });

  // ── Mutations ──────────────────────────────────────────

  const sendMutation = useMutation({
    mutationFn: (body: string) =>
      sendMessage(companyId!, {
        conversation_id: selectedId!,
        body,
        sender_id: userId!,
        contact_id: selectedConv?.contact_id ?? undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["messages", companyId, selectedId] });
      void queryClient.invalidateQueries({ queryKey: ["conversations", companyId] });
    },
    onError: () => toast.error("Erro ao enviar mensagem"),
  });

  const favoriteMutation = useMutation({
    mutationFn: ({ id, current }: { id: string; current: boolean }) => toggleFavorite(id, current),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["messages", companyId, selectedId] }),
  });

  const noteMutation = useMutation({
    mutationFn: (body: string) => addNote(companyId!, { conversation_id: selectedId!, author_id: userId!, body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notes", companyId, selectedId] });
      toast.success("Nota adicionada");
    },
  });

  const updateConvMutation = useMutation({
    mutationFn: (updates: Record<string, any>) => updateConvDB(selectedId!, updates),
    onSuccess: (_, updates) => {
      void queryClient.invalidateQueries({ queryKey: ["conversations", companyId] });
      if (updates.status) toast.success(`Status alterado para: ${updates.status}`);
      if (updates.assigned_to) toast.success("Atendente atribuído");
      if (updates.department_id) toast.success("Departamento alterado");
      // Log the action
      void addLog(companyId!, {
        conversation_id: selectedId!,
        actor_id: userId,
        action: Object.keys(updates).join(","),
        metadata: updates,
      });
    },
  });

  // ── AI Suggestion ──────────────────────────────────────

  const [aiSuggestion, setAiSuggestion] = useState<{
    reply: string;
    sentiment?: string;
    intent?: string;
    confidence?: number;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const requestAISuggestion = useCallback(async () => {
    if (!companyId || !selectedId || messages.length === 0) return;
    setAiLoading(true);
    try {
      const recentMsgs = messages.slice(-10).map((m) => ({
        role: m.from_me ? "assistant" : "user",
        text: m.body,
      }));
      const result = await suggestReply(companyId, selectedId, recentMsgs);
      setAiSuggestion(result);
    } catch (err) {
      // IA not enabled or error — silently ignore
      setAiSuggestion(null);
    } finally {
      setAiLoading(false);
    }
  }, [companyId, selectedId, messages]);

  // Request AI suggestion when selecting a conversation with unread messages
  useEffect(() => {
    if (selectedId && selectedConv && selectedConv.unread_count > 0) {
      requestAISuggestion();
    } else {
      setAiSuggestion(null);
    }
  }, [selectedId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Render ─────────────────────────────────────────────

  const statusConfig: Record<string, { label: string; color: string }> = {
    open: { label: "Aberta", color: "bg-primary/10 text-primary" },
    pending: { label: "Pendente", color: "bg-yellow-500/10 text-yellow-500" },
    resolved: { label: "Resolvida", color: "bg-green-500/10 text-green-500" },
    archived: { label: "Arquivada", color: "bg-muted text-muted-foreground" },
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Conversation List */}
      <div className={cn(
        "flex flex-col border-r border-border/40 bg-[#0A0A0A] shrink-0 transition-all duration-300",
        selectedId ? "hidden md:flex w-80 lg:w-[340px]" : "flex-1 md:w-80 lg:w-[340px] md:flex-none",
      )}>
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          onSelect={setSelectedId}
          isLoading={loadingConvs}
        />
      </div>

      {/* Center: Chat Area */}
      {selectedId && selectedConv ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/40 bg-card/30 shrink-0">
            <button
              onClick={() => setSelectedId(null)}
              className="md:hidden text-muted-foreground hover:text-foreground mr-1 text-lg"
            >
              ←
            </button>

            {/* Avatar */}
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
              {selectedConv.contacts?.avatar_url ? (
                <img src={selectedConv.contacts.avatar_url} className="h-full w-full rounded-full object-cover" alt="" />
              ) : (
                selectedConv.contacts?.name?.[0]?.toUpperCase() ?? "?"
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold truncate">{selectedConv.contacts?.name ?? "Desconhecido"}</p>
                <Badge variant="outline" className={cn("text-[10px] h-4", statusConfig[selectedConv.status]?.color)}>
                  {statusConfig[selectedConv.status]?.label}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                {selectedConv.contacts?.phone ?? ""} {selectedConv.departments ? `· ${selectedConv.departments.name}` : ""}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={requestAISuggestion}
                disabled={aiLoading}
                title="Sugestão IA"
              >
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowPanel(!showPanel)}
                title={showPanel ? "Fechar painel" : "Abrir painel"}
              >
                {showPanel ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-[#080808]">
            {loadingMsgs ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground/15 mb-4" />
                <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Envie a primeira mensagem para iniciar o atendimento</p>
              </div>
            ) : (
              <div className="py-4 space-y-0.5">
                {/* Date separator */}
                <div className="flex justify-center py-2 mb-2">
                  <span className="text-[10px] text-muted-foreground/50 bg-accent/30 px-3 py-1 rounded-full">
                    {new Date(messages[0]?.sent_at ?? "").toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}
                  </span>
                </div>
                {messages.map((msg) => (
                  <ChatMessageBubble
                    key={msg.id}
                    message={msg}
                    showSender
                    onFavorite={(id) => {
                      const m = messages.find((x) => x.id === id);
                      if (m) favoriteMutation.mutate({ id, current: m.favorited });
                    }}
                  />
                ))}
                {isTyping && <TypingIndicator name={selectedConv.contacts?.name ?? undefined} />}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* AI Suggestion Card */}
          <AISuggestionCard
            suggestion={aiSuggestion?.reply ?? null}
            sentiment={aiSuggestion?.sentiment}
            intent={aiSuggestion?.intent}
            confidence={aiSuggestion?.confidence}
            isLoading={aiLoading}
            onAccept={() => {
              if (aiSuggestion?.reply) {
                sendMutation.mutate(aiSuggestion.reply);
                setAiSuggestion(null);
              }
            }}
            onCopy={() => {
              if (aiSuggestion?.reply) {
                navigator.clipboard.writeText(aiSuggestion.reply);
                toast.success("Copiado!");
              }
            }}
            onReject={() => setAiSuggestion(null)}
            onRefresh={requestAISuggestion}
          />

          {/* Chat Input */}
          <ChatInput
            onSend={(body) => sendMutation.mutate(body)}
            quickReplies={quickReplies}
            disabled={sendMutation.isPending}
            aiSuggestion={undefined}
          />
        </div>
      ) : (
        /* Empty state */
        <div className="flex-1 hidden md:flex items-center justify-center flex-col text-center bg-[#080808]">
          <div className="h-20 w-20 rounded-2xl bg-accent/30 flex items-center justify-center mb-5">
            <MessageSquare className="h-10 w-10 text-muted-foreground/20" />
          </div>
          <p className="text-sm text-muted-foreground">Selecione uma conversa para começar</p>
          <p className="text-xs text-muted-foreground/50 mt-1">ou conecte um WhatsApp para receber mensagens</p>
        </div>
      )}

      {/* Right: Contact Panel */}
      {selectedId && selectedConv && showPanel && (
        <div className="hidden lg:flex">
          <ContactPanel
            contact={selectedConv.contacts ?? null}
            conversation={selectedConv}
            notes={notes}
            labels={labels}
            agents={agents}
            departments={departments}
            onUpdateConversation={(updates) => updateConvMutation.mutate(updates)}
            onAddNote={(body) => noteMutation.mutate(body)}
            onClose={() => setShowPanel(false)}
            aiSummary={selectedConv.ai_summary}
            aiSentiment={selectedConv.ai_sentiment}
          />
        </div>
      )}
    </div>
  );
}
