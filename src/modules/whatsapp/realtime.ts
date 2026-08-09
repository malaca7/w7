import { getSupabaseClient } from "@/modules/whatsapp/supabase";
import type { RealtimeEvent } from "@/modules/whatsapp/types";

type Unsubscribe = () => void;

type EventCallback<TPayload> = (payload: RealtimeEvent<TPayload>) => void;

const memoryBus = new EventTarget();

export function publishEvent<TPayload>(channel: string, payload: RealtimeEvent<TPayload>) {
  const supabase = getSupabaseClient();

  if (supabase) {
    void supabase.channel(channel).send({ type: "broadcast", event: payload.event, payload });
  }

  memoryBus.dispatchEvent(new CustomEvent(channel, { detail: payload }));
}

export function subscribeEvent<TPayload>(
  channel: string,
  event: string,
  callback: EventCallback<TPayload>,
): Unsubscribe {
  const supabase = getSupabaseClient();

  if (!supabase) {
    const handler = (rawEvent: Event) => {
      const customEvent = rawEvent as CustomEvent<RealtimeEvent<TPayload>>;
      if (customEvent.detail?.event === event) {
        callback(customEvent.detail);
      }
    };

    memoryBus.addEventListener(channel, handler);
    return () => {
      memoryBus.removeEventListener(channel, handler);
    };
  }

  const supabaseChannel = supabase
    .channel(channel)
    .on("broadcast", { event }, ({ payload }) => {
      callback(payload as RealtimeEvent<TPayload>);
    })
    .subscribe();

  return () => {
    void supabase.removeChannel(supabaseChannel);
  };
}
