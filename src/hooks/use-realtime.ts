import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Subscribe to Supabase Realtime changes on a table and auto-invalidate react-query keys.
 */
export function useRealtimeSubscription(
  table: string,
  companyId: string | undefined,
  invalidateKeys: string[][],
  event: "INSERT" | "UPDATE" | "DELETE" | "*" = "*",
) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!companyId) return;
    const sb = getSupabase();
    if (!sb) return;

    const channel = sb
      .channel(`${table}-${companyId}`)
      .on(
        "postgres_changes",
        {
          event,
          schema: "public",
          table,
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          for (const key of invalidateKeys) {
            void queryClient.invalidateQueries({ queryKey: key });
          }
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      void sb.removeChannel(channel);
    };
  }, [table, companyId, event, queryClient, invalidateKeys]);
}

/**
 * Subscribe to conversation realtime updates (messages, status changes).
 */
export function useConversationRealtime(companyId: string | undefined, conversationId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!companyId) return;
    const sb = getSupabase();
    if (!sb) return;

    const channels: RealtimeChannel[] = [];

    // Messages for the current conversation
    if (conversationId) {
      const msgChannel = sb
        .channel(`messages-${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "whatsapp_messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          () => {
            void queryClient.invalidateQueries({ queryKey: ["messages", companyId, conversationId] });
            void queryClient.invalidateQueries({ queryKey: ["conversations", companyId] });
          },
        )
        .subscribe();
      channels.push(msgChannel);
    }

    // Conversation list updates
    const convChannel = sb
      .channel(`conversations-${companyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["conversations", companyId] });
          void queryClient.invalidateQueries({ queryKey: ["dashboard-stats", companyId] });
        },
      )
      .subscribe();
    channels.push(convChannel);

    // Connection status updates
    const connChannel = sb
      .channel(`connections-${companyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "whatsapp_connections",
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["connections", companyId] });
          void queryClient.invalidateQueries({ queryKey: ["dashboard-stats", companyId] });
        },
      )
      .subscribe();
    channels.push(connChannel);

    return () => {
      for (const ch of channels) {
        void sb.removeChannel(ch);
      }
    };
  }, [companyId, conversationId, queryClient]);
}

/**
 * Presence-based "typing" and "online" indicators.
 */
export function usePresence(companyId: string | undefined, userId: string | undefined) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!companyId || !userId) return;
    const sb = getSupabase();
    if (!sb) return;

    const channel = sb.channel(`presence-${companyId}`, {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        // Presence state is automatically tracked
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: userId, online_at: new Date().toISOString() });
        }
      });

    channelRef.current = channel;

    return () => {
      void sb.removeChannel(channel);
    };
  }, [companyId, userId]);

  return channelRef;
}
