import { cn } from "@/lib/utils";
import { Check, CheckCheck, Star, File, Play, MapPin, User as UserIcon, Image as ImageIcon, Video } from "lucide-react";
import type { WhatsAppMessage } from "@/lib/supabase";

interface ChatMessageBubbleProps {
  message: WhatsAppMessage;
  showSender?: boolean;
  onFavorite?: (id: string) => void;
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function StatusIcon({ message }: { message: WhatsAppMessage }) {
  if (!message.from_me) return null;
  if (message.read_at) return <CheckCheck className="h-3 w-3 text-blue-400" />;
  if (message.delivered_at) return <CheckCheck className="h-3 w-3 text-muted-foreground/50" />;
  return <Check className="h-3 w-3 text-muted-foreground/50" />;
}

function AttachmentPreview({ message }: { message: WhatsAppMessage }) {
  const attachment = message.attachments?.[0];
  if (!attachment && message.type === "text") return null;

  switch (message.type) {
    case "image":
      return (
        <div className="rounded-lg overflow-hidden mb-1.5 max-w-[280px]">
          {attachment?.url ? (
            <img src={attachment.url} alt="" className="w-full h-auto max-h-64 object-cover rounded-lg" />
          ) : (
            <div className="h-40 bg-accent/50 flex items-center justify-center rounded-lg">
              <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
            </div>
          )}
        </div>
      );
    case "video":
      return (
        <div className="rounded-lg overflow-hidden mb-1.5 max-w-[280px] relative">
          {attachment?.url ? (
            <video src={attachment.url} className="w-full max-h-64 rounded-lg" controls />
          ) : (
            <div className="h-40 bg-accent/50 flex items-center justify-center rounded-lg">
              <Play className="h-8 w-8 text-muted-foreground/30" />
            </div>
          )}
        </div>
      );
    case "audio":
      return (
        <div className="flex items-center gap-3 min-w-[200px]">
          <button className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Play className="h-4 w-4 text-primary ml-0.5" />
          </button>
          <div className="flex-1">
            <div className="h-1 bg-accent rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-primary/50 rounded-full" />
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5 block">
              {attachment?.duration_seconds ? `${Math.floor(attachment.duration_seconds / 60)}:${String(attachment.duration_seconds % 60).padStart(2, "0")}` : "0:00"}
            </span>
          </div>
        </div>
      );
    case "document":
      return (
        <div className="flex items-center gap-3 p-2 rounded-lg bg-accent/30 min-w-[200px]">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <File className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate">{attachment?.file_name ?? "Documento"}</p>
            <p className="text-[10px] text-muted-foreground">
              {attachment?.size_bytes ? `${(attachment.size_bytes / 1024).toFixed(0)} KB` : ""}
            </p>
          </div>
        </div>
      );
    case "location":
      return (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-accent/30 min-w-[180px]">
          <MapPin className="h-5 w-5 text-primary shrink-0" />
          <span className="text-xs">Localização compartilhada</span>
        </div>
      );
    case "contact":
      return (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-accent/30 min-w-[180px]">
          <UserIcon className="h-5 w-5 text-primary shrink-0" />
          <span className="text-xs">Contato compartilhado</span>
        </div>
      );
    case "system":
      return null;
    default:
      return null;
  }
}

export function ChatMessageBubble({ message, showSender, onFavorite }: ChatMessageBubbleProps) {
  const isMe = message.from_me;
  const isSystem = message.type === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <span className="text-[11px] text-muted-foreground bg-accent/50 px-3 py-1 rounded-full">
          {message.body}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("group flex gap-2 px-4 py-0.5", isMe ? "justify-end" : "justify-start")}>
      <div className={cn(
        "relative max-w-[75%] rounded-2xl px-3.5 py-2",
        isMe
          ? "bg-primary/15 rounded-tr-sm"
          : "bg-accent/60 rounded-tl-sm",
      )}>
        {/* Sender name for group chats */}
        {showSender && !isMe && message.sender?.full_name && (
          <p className="text-[11px] font-semibold text-primary mb-0.5">{message.sender.full_name}</p>
        )}

        {/* Quoted message */}
        {message.quoted_message_id && (
          <div className="border-l-2 border-primary/50 pl-2 mb-1.5 py-1">
            <p className="text-[10px] text-muted-foreground line-clamp-2 italic">Mensagem citada</p>
          </div>
        )}

        {/* Attachment */}
        <AttachmentPreview message={message} />

        {/* Body */}
        {message.body && message.type === "text" && (
          <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{message.body}</p>
        )}
        {message.body && message.type !== "text" && message.body.trim() && (
          <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words mt-1">{message.body}</p>
        )}

        {/* Footer: time + status */}
        <div className={cn("flex items-center gap-1.5 mt-1", isMe ? "justify-end" : "justify-end")}>
          {message.favorited && <Star className="h-2.5 w-2.5 text-yellow-400 fill-yellow-400" />}
          <span className="text-[10px] text-muted-foreground/70">{formatTime(message.sent_at)}</span>
          <StatusIcon message={message} />
        </div>

        {/* Hover actions */}
        <div className={cn(
          "absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity",
          isMe ? "-left-8" : "-right-8",
        )}>
          <button
            onClick={() => onFavorite?.(message.id)}
            className="h-6 w-6 rounded-full bg-accent/80 flex items-center justify-center hover:bg-accent"
          >
            <Star className={cn("h-3 w-3", message.favorited ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground")} />
          </button>
        </div>
      </div>
    </div>
  );
}
