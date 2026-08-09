import { useEffect } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  addConnection,
  addInternalNote,
  createScheduledMessage,
  deleteConnection,
  deleteScheduledMessage,
  getConversationViews,
  getMessages,
  getWorkspaceData,
  renameConnection,
  searchMessages,
  sendMessage,
  setConnectionStatus,
  toggleFavoriteMessage,
  triggerMockIncomingMessage,
  updateConversation,
} from "@/modules/whatsapp/api";
import { subscribeEvent } from "@/modules/whatsapp/realtime";
import type { ConversationPriority, ConversationStatus, Message } from "@/modules/whatsapp/types";

const wsKey = (tenantId: string) => ["w7-whatsapp-workspace", tenantId] as const;
const conversationsKey = (tenantId: string) => ["w7-whatsapp-conversations", tenantId] as const;
const messagesKey = (tenantId: string, conversationId: string) =>
  ["w7-whatsapp-messages", tenantId, conversationId] as const;

export function useWhatsAppWorkspace(tenantId: string) {
  return useQuery({
    queryKey: wsKey(tenantId),
    queryFn: () => getWorkspaceData(tenantId),
    placeholderData: keepPreviousData,
  });
}

export function useConversationViews(tenantId: string) {
  return useQuery({
    queryKey: conversationsKey(tenantId),
    queryFn: () => getConversationViews(tenantId),
    placeholderData: keepPreviousData,
  });
}

export function useConversationMessages(tenantId: string, conversationId?: string) {
  return useQuery({
    queryKey: messagesKey(tenantId, conversationId ?? ""),
    queryFn: () => getMessages(tenantId, conversationId ?? ""),
    enabled: Boolean(conversationId),
    placeholderData: keepPreviousData,
  });
}

export function useSendMessage(
  tenantId: string,
  options?: UseMutationOptions<
    Message,
    Error,
    { conversationId: string; body: string; type: Message["type"]; agentId: string; quotedMessageId?: string }
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => sendMessage(tenantId, payload),
    onSuccess: (message, variables, context) => {
      void queryClient.invalidateQueries({ queryKey: wsKey(tenantId) });
      void queryClient.invalidateQueries({ queryKey: conversationsKey(tenantId) });
      void queryClient.invalidateQueries({ queryKey: messagesKey(tenantId, variables.conversationId) });
      options?.onSuccess?.(message, variables, context);
    },
    ...options,
  });
}

export function useWhatsAppActions(tenantId: string, actorAgentId: string) {
  const queryClient = useQueryClient();

  const invalidate = async (conversationId?: string) => {
    await queryClient.invalidateQueries({ queryKey: wsKey(tenantId) });
    await queryClient.invalidateQueries({ queryKey: conversationsKey(tenantId) });
    if (conversationId) {
      await queryClient.invalidateQueries({ queryKey: messagesKey(tenantId, conversationId) });
    }
  };

  return {
    addConnection: useMutation({
      mutationFn: addConnection.bind(null, tenantId),
      onSuccess: () => void invalidate(),
    }),
    setConnectionStatus: useMutation({
      mutationFn: ({ connectionId, status }: { connectionId: string; status: "online" | "offline" | "connecting" | "error" }) =>
        setConnectionStatus(tenantId, connectionId, status),
      onSuccess: () => void invalidate(),
    }),
    renameConnection: useMutation({
      mutationFn: ({ connectionId, name }: { connectionId: string; name: string }) =>
        renameConnection(tenantId, connectionId, name),
      onSuccess: () => void invalidate(),
    }),
    deleteConnection: useMutation({
      mutationFn: (connectionId: string) => deleteConnection(tenantId, connectionId),
      onSuccess: () => void invalidate(),
    }),
    addNote: useMutation({
      mutationFn: ({ conversationId, body }: { conversationId: string; body: string }) =>
        addInternalNote(tenantId, { conversationId, body, agentId: actorAgentId }),
      onSuccess: (_, variables) => void invalidate(variables.conversationId),
    }),
    updateConversation: useMutation({
      mutationFn: ({
        conversationId,
        status,
        priority,
        assignedAgentId,
        queueId,
        departmentId,
        labelIds,
      }: {
        conversationId: string;
        status?: ConversationStatus;
        priority?: ConversationPriority;
        assignedAgentId?: string;
        queueId?: string;
        departmentId?: string;
        labelIds?: string[];
      }) =>
        updateConversation(
          tenantId,
          conversationId,
          { status, priority, assignedAgentId, queueId, departmentId, labelIds },
          actorAgentId,
        ),
      onSuccess: () => void invalidate(),
    }),
    favoriteMessage: useMutation({
      mutationFn: (messageId: string) => toggleFavoriteMessage(tenantId, messageId),
      onSuccess: () => void invalidate(),
    }),
    createScheduledMessage: useMutation({
      mutationFn: (payload: {
        body: string;
        type: "once" | "recurring";
        scheduleAt: string;
        recurrenceRule?: string;
        conversationId?: string;
        contactId?: string;
      }) => createScheduledMessage(tenantId, { ...payload, createdByAgentId: actorAgentId }),
      onSuccess: () => void invalidate(),
    }),
    cancelScheduledMessage: useMutation({
      mutationFn: (scheduledMessageId: string) => deleteScheduledMessage(tenantId, scheduledMessageId),
      onSuccess: () => void invalidate(),
    }),
    searchMessages: useMutation({ mutationFn: (query: string) => searchMessages(tenantId, query) }),
    triggerMockIncoming: useMutation({
      mutationFn: (conversationId: string) => triggerMockIncomingMessage(tenantId, conversationId),
      onSuccess: (_, conversationId) => void invalidate(conversationId),
    }),
  };
}

export function useRealtimeSync(tenantId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const disposeMessage = subscribeEvent("w7-whatsapp", "message_created", (event) => {
      if (event.tenantId !== tenantId) return;
      void queryClient.invalidateQueries({ queryKey: wsKey(tenantId) });
      void queryClient.invalidateQueries({ queryKey: conversationsKey(tenantId) });
    });

    const disposeConnection = subscribeEvent("w7-whatsapp", "connection_updated", (event) => {
      if (event.tenantId !== tenantId) return;
      void queryClient.invalidateQueries({ queryKey: wsKey(tenantId) });
    });

    const disposeConversation = subscribeEvent("w7-whatsapp", "conversation_updated", (event) => {
      if (event.tenantId !== tenantId) return;
      void queryClient.invalidateQueries({ queryKey: wsKey(tenantId) });
      void queryClient.invalidateQueries({ queryKey: conversationsKey(tenantId) });
    });

    return () => {
      disposeMessage();
      disposeConnection();
      disposeConversation();
    };
  }, [queryClient, tenantId]);
}
