import { useState, useRef, useCallback, useEffect } from "react";
import { Send, Paperclip, Smile, Mic, Image, Video, File, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { EmojiPicker } from "./emoji-picker";
import type { WhatsAppQuickReply } from "@/lib/supabase";

interface ChatInputProps {
  onSend: (body: string, type?: string) => void;
  onTyping?: () => void;
  quickReplies?: WhatsAppQuickReply[];
  disabled?: boolean;
  placeholder?: string;
  aiSuggestion?: string;
  onAcceptSuggestion?: () => void;
}

export function ChatInput({
  onSend,
  onTyping,
  quickReplies = [],
  disabled,
  placeholder = "Digite uma mensagem…",
  aiSuggestion,
  onAcceptSuggestion,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  // Quick reply trigger
  useEffect(() => {
    if (text.startsWith("/") && text.length > 1) {
      setShowQuickReplies(true);
    } else {
      setShowQuickReplies(false);
    }
  }, [text]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    setShowEmoji(false);
    textareaRef.current?.focus();
  }, [text, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickReply = (qr: WhatsAppQuickReply) => {
    setText(qr.body);
    setShowQuickReplies(false);
    textareaRef.current?.focus();
  };

  const handleEmojiSelect = (emoji: string) => {
    setText((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  const filteredQuickReplies = quickReplies.filter((qr) =>
    text.length > 1 ? qr.shortcut.toLowerCase().includes(text.slice(1).toLowerCase()) || qr.title.toLowerCase().includes(text.slice(1).toLowerCase()) : true
  );

  return (
    <div className="relative border-t border-border/40 bg-card/30">
      {/* AI Suggestion */}
      {aiSuggestion && (
        <div className="px-4 py-2.5 border-b border-border/30 bg-primary/5">
          <div className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-primary mb-0.5">Sugestão da IA</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{aiSuggestion}</p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[10px] px-2"
                onClick={() => {
                  setText(aiSuggestion);
                  textareaRef.current?.focus();
                }}
              >
                Editar
              </Button>
              <Button
                size="sm"
                className="h-6 text-[10px] px-2"
                onClick={onAcceptSuggestion}
              >
                Enviar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Replies Popup */}
      {showQuickReplies && filteredQuickReplies.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mx-4 mb-1 bg-popover border border-border/50 rounded-xl shadow-lg max-h-48 overflow-y-auto z-10">
          {filteredQuickReplies.map((qr) => (
            <button
              key={qr.id}
              onClick={() => handleQuickReply(qr)}
              className="w-full flex items-start gap-3 px-3.5 py-2.5 hover:bg-accent/50 transition-colors text-left"
            >
              <span className="text-xs font-mono text-primary shrink-0">/{qr.shortcut}</span>
              <div className="min-w-0">
                <p className="text-xs font-medium">{qr.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">{qr.body}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Emoji Picker */}
      {showEmoji && (
        <div className="absolute bottom-full left-4 mb-2 z-20">
          <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} />
        </div>
      )}

      {/* Attachment Menu */}
      {showAttachMenu && (
        <div className="absolute bottom-full left-4 mb-2 bg-popover border border-border/50 rounded-xl shadow-lg z-10 p-1.5">
          {[
            { icon: Image, label: "Imagem", accept: "image/*" },
            { icon: Video, label: "Vídeo", accept: "video/*" },
            { icon: File, label: "Documento", accept: "*" },
            { icon: Mic, label: "Áudio", accept: "audio/*" },
          ].map(({ icon: Icon, label, accept }) => (
            <button
              key={label}
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = accept;
                  fileInputRef.current.click();
                }
                setShowAttachMenu(false);
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors w-full text-left"
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2 p-3">
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => { setShowEmoji(!showEmoji); setShowAttachMenu(false); }}
          >
            <Smile className="h-4.5 w-4.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => { setShowAttachMenu(!showAttachMenu); setShowEmoji(false); }}
          >
            <Paperclip className="h-4.5 w-4.5" />
          </Button>
        </div>

        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onTyping?.();
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 min-h-[36px] max-h-[120px] resize-none bg-accent/40 border-border/30 text-sm py-2 px-3 rounded-xl"
        />

        <Button
          type="button"
          size="icon"
          className={cn(
            "h-9 w-9 rounded-xl shrink-0 transition-all duration-200",
            text.trim() ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-accent text-muted-foreground",
          )}
          onClick={handleSend}
          disabled={!text.trim() || disabled}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <input ref={fileInputRef} type="file" className="hidden" />
    </div>
  );
}
