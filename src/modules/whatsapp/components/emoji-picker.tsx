import { useState, useMemo } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: "Frequentes",
    emojis: ["😊", "👍", "❤️", "😂", "🙏", "😍", "🎉", "🔥", "✅", "👏", "💪", "😉", "🤝", "⭐", "💯", "🚀"],
  },
  {
    label: "Rostos",
    emojis: ["😀", "😃", "😄", "😁", "😆", "🥹", "😅", "🤣", "🥲", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🫢", "🫣", "🤫", "🤔", "🫡", "🤐", "🤨", "😐", "😑", "😶", "🫥", "😏", "😒", "🙄", "😬", "😮‍💨", "🤥", "🫨"],
  },
  {
    label: "Gestos",
    emojis: ["👋", "🤚", "🖐️", "✋", "🖖", "🫱", "🫲", "🫳", "🫴", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "🫵", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "🫶", "👐", "🤲", "🤝", "🙏"],
  },
  {
    label: "Objetos",
    emojis: ["💼", "📱", "💻", "⌨️", "🖨️", "📞", "📧", "📝", "📋", "📎", "📌", "📍", "🔗", "✂️", "📊", "📈", "📉", "🗓️", "⏰", "🔔", "🔑", "🔒", "💡", "🎯", "🏆", "🎁", "📦", "💰", "💳", "🧾"],
  },
  {
    label: "Símbolos",
    emojis: ["✅", "❌", "❓", "❗", "‼️", "⚠️", "🔴", "🟡", "🟢", "🔵", "⬛", "⬜", "◾", "◽", "▪️", "▫️", "🔶", "🔷", "🔸", "🔹", "💠", "🔘", "🔲", "🔳"],
  },
];

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(0);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return EMOJI_CATEGORIES;
    // Simple search — just show all emojis flat
    const allEmojis = EMOJI_CATEGORIES.flatMap((c) => c.emojis);
    return [{ label: "Resultados", emojis: allEmojis }];
  }, [search]);

  return (
    <div className="w-72 h-80 bg-popover border border-border/50 rounded-xl shadow-lg flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar emoji…"
          className="flex-1 h-7 text-xs bg-transparent border-none outline-none placeholder:text-muted-foreground"
          autoFocus
        />
        <button onClick={onClose} className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent">
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Category tabs */}
      {!search && (
        <div className="flex gap-0.5 px-2 py-1.5 border-b border-border/30">
          {EMOJI_CATEGORIES.map((cat, i) => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(i)}
              className={cn(
                "text-[10px] px-2 py-1 rounded-md transition-colors",
                activeCategory === i ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accent",
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Emojis grid */}
      <div className="flex-1 overflow-y-auto p-2">
        {(search ? filteredCategories : [EMOJI_CATEGORIES[activeCategory]]).map((cat) => (
          <div key={cat.label}>
            <div className="grid grid-cols-8 gap-0.5">
              {cat.emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onSelect(emoji)}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent/60 transition-colors text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
