import { useState } from "react";
import {
  User, Phone, Mail, Building2, MapPin, Tag, StickyNote, Clock,
  ChevronDown, ChevronRight, Edit, X, Sparkles, ArrowRightLeft,
  PauseCircle, CheckCircle2, RotateCcw, UserPlus, History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Contact, Conversation, WhatsAppNote, WhatsAppLabel, Profile, Department } from "@/lib/supabase";

interface ContactPanelProps {
  contact: Contact | null;
  conversation: Conversation;
  notes: WhatsAppNote[];
  labels: WhatsAppLabel[];
  agents: Profile[];
  departments: Department[];
  onUpdateConversation: (updates: Record<string, any>) => void;
  onAddNote: (body: string) => void;
  onClose: () => void;
  aiSummary?: string | null;
  aiSentiment?: string | null;
}

function Section({ title, icon: Icon, defaultOpen = true, children }: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border/30 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-accent/30 transition-colors"
      >
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex-1 text-left">{title}</span>
        {open ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

function InfoRow({ label, value, icon: Icon }: { label: string; value?: string | null; icon?: React.ComponentType<{ className?: string }> }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 py-1">
      {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-xs truncate">{value}</p>
      </div>
    </div>
  );
}

function timeAgo(date: string | null) {
  if (!date) return "—";
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

export function ContactPanel({
  contact,
  conversation,
  notes,
  labels,
  agents,
  departments,
  onUpdateConversation,
  onAddNote,
  onClose,
  aiSummary,
  aiSentiment,
}: ContactPanelProps) {
  const [noteText, setNoteText] = useState("");

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    onAddNote(noteText.trim());
    setNoteText("");
  };

  const sentimentConfig: Record<string, { label: string; color: string; emoji: string }> = {
    positivo: { label: "Positivo", color: "text-green-400 bg-green-500/10", emoji: "😊" },
    neutro: { label: "Neutro", color: "text-muted-foreground bg-accent/50", emoji: "😐" },
    negativo: { label: "Negativo", color: "text-red-400 bg-red-500/10", emoji: "😠" },
  };

  return (
    <div className="flex flex-col h-full border-l border-border/40 bg-card/20 w-80">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <h3 className="text-sm font-semibold">Detalhes</h3>
        <button onClick={onClose} className="h-6 w-6 rounded flex items-center justify-center hover:bg-accent">
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        {/* Contact Avatar + Name */}
        <div className="flex flex-col items-center py-5 px-4 border-b border-border/30">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary mb-3">
            {contact?.avatar_url ? (
              <img src={contact.avatar_url} className="h-full w-full rounded-full object-cover" alt="" />
            ) : (
              contact?.name?.[0]?.toUpperCase() ?? "?"
            )}
          </div>
          <p className="text-sm font-semibold">{contact?.name ?? "Desconhecido"}</p>
          <p className="text-xs text-muted-foreground">{contact?.phone ?? contact?.whatsapp ?? ""}</p>
          {contact?.stage && (
            <Badge variant="outline" className="mt-2 text-[10px] capitalize">
              {contact.stage}
            </Badge>
          )}
        </div>

        {/* AI Section */}
        {(aiSummary || aiSentiment) && (
          <Section title="Análise IA" icon={Sparkles} defaultOpen>
            {aiSentiment && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] text-muted-foreground">Sentimento:</span>
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", sentimentConfig[aiSentiment]?.color)}>
                  {sentimentConfig[aiSentiment]?.emoji} {sentimentConfig[aiSentiment]?.label ?? aiSentiment}
                </span>
              </div>
            )}
            {aiSummary && (
              <p className="text-xs text-muted-foreground leading-relaxed">{aiSummary}</p>
            )}
          </Section>
        )}

        {/* Contact Info */}
        <Section title="Informações" icon={User} defaultOpen>
          <InfoRow label="Telefone" value={contact?.phone} icon={Phone} />
          <InfoRow label="WhatsApp" value={contact?.whatsapp} icon={Phone} />
          <InfoRow label="E-mail" value={contact?.email} icon={Mail} />
          <InfoRow label="Empresa" value={contact?.company_name} icon={Building2} />
          <InfoRow label="Cidade" value={contact?.city ? `${contact.city}${contact.state ? ` - ${contact.state}` : ""}` : null} icon={MapPin} />
          <InfoRow label="CPF/CNPJ" value={contact?.cpf_cnpj} />
          <InfoRow label="Última interação" value={timeAgo(contact?.last_interaction_at)} icon={Clock} />
        </Section>

        {/* Tags */}
        {contact?.tags && contact.tags.length > 0 && (
          <Section title="Etiquetas" icon={Tag}>
            <div className="flex flex-wrap gap-1.5">
              {contact.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
              ))}
            </div>
          </Section>
        )}

        {/* Conversation Actions */}
        <Section title="Ações" icon={ArrowRightLeft} defaultOpen>
          <div className="space-y-2">
            {/* Assign agent */}
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Atendente</label>
              <Select
                value={conversation.assigned_to ?? ""}
                onValueChange={(v) => onUpdateConversation({ assigned_to: v || null })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Não atribuído" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Não atribuído</SelectItem>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.full_name ?? "Sem nome"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department */}
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Departamento</label>
              <Select
                value={conversation.department_id ?? ""}
                onValueChange={(v) => onUpdateConversation({ department_id: v || null })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Prioridade</label>
              <Select
                value={conversation.priority ?? "normal"}
                onValueChange={(v) => onUpdateConversation({ priority: v })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Baixa</SelectItem>
                  <SelectItem value="normal">🔵 Normal</SelectItem>
                  <SelectItem value="high">🟠 Alta</SelectItem>
                  <SelectItem value="critical">🔴 Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status actions */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {conversation.status === "open" && (
                <>
                  <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => onUpdateConversation({ status: "pending" })}>
                    <PauseCircle className="h-3 w-3" /> Pausar
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => onUpdateConversation({ status: "resolved" })}>
                    <CheckCircle2 className="h-3 w-3" /> Finalizar
                  </Button>
                </>
              )}
              {conversation.status === "pending" && (
                <>
                  <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => onUpdateConversation({ status: "open" })}>
                    <RotateCcw className="h-3 w-3" /> Reabrir
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => onUpdateConversation({ status: "resolved" })}>
                    <CheckCircle2 className="h-3 w-3" /> Finalizar
                  </Button>
                </>
              )}
              {(conversation.status === "resolved" || conversation.status === "archived") && (
                <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => onUpdateConversation({ status: "open" })}>
                  <RotateCcw className="h-3 w-3" /> Reabrir
                </Button>
              )}
            </div>
          </div>
        </Section>

        {/* Notes */}
        <Section title={`Notas (${notes.length})`} icon={StickyNote}>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Adicionar nota interna…"
                rows={2}
                className="text-xs min-h-[56px] bg-accent/40 border-border/30"
              />
            </div>
            <Button size="sm" className="w-full h-7 text-[10px]" onClick={handleAddNote} disabled={!noteText.trim()}>
              Adicionar nota
            </Button>
            {notes.map((note) => (
              <div key={note.id} className="rounded-lg bg-accent/30 p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-medium">{note.author?.full_name ?? "Atendente"}</span>
                  <span className="text-[10px] text-muted-foreground">• {timeAgo(note.created_at)}</span>
                </div>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{note.body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Observations */}
        {contact?.notes && (
          <Section title="Observações" icon={History}>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">{contact.notes}</p>
          </Section>
        )}
      </ScrollArea>
    </div>
  );
}
