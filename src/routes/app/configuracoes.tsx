import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { updateCompany } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Building2, Bell, Shield, Zap, MessageSquare, Clock, Plus,
  Trash2, Edit, Save, Loader2,
} from "lucide-react";
import {
  fetchAutomations, upsertAutomation, deleteAutomation,
  fetchQuickReplies, createQuickReply, deleteQuickReply,
  fetchBusinessHours, upsertBusinessHour,
} from "@/lib/whatsapp-db";
import type { WhatsAppAutomation, WhatsAppQuickReply, WhatsAppBusinessHour } from "@/lib/supabase";

export const Route = createFileRoute("/app/configuracoes")({
  component: ConfiguracoesPage,
});

const companySchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail inválido").or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url("URL inválida").or(z.literal("")).optional(),
  address: z.string().optional(),
});
type CompanyForm = z.infer<typeof companySchema>;

const DAYS_OF_WEEK = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function ConfiguracoesPage() {
  const { authUser, refresh } = useAuth();
  const companyId = authUser?.company.id;
  const queryClient = useQueryClient();

  // ── Company Form ────────────────────────────────────────

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: authUser?.company.name ?? "",
      email: authUser?.company.email ?? "",
      phone: authUser?.company.phone ?? "",
      website: authUser?.company.website ?? "",
      address: authUser?.company.address ?? "",
    },
  });

  const onSaveCompany = async (data: CompanyForm) => {
    if (!companyId) return;
    try {
      await updateCompany(companyId, {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        website: data.website || null,
        address: data.address || null,
      } as any);
      toast.success("Configurações salvas!");
      refresh();
    } catch {
      toast.error("Erro ao salvar configurações");
    }
  };

  // ── Automations ─────────────────────────────────────────

  const { data: automations = [] } = useQuery({
    queryKey: ["automations", companyId],
    enabled: !!companyId,
    queryFn: () => fetchAutomations(companyId!),
  });

  const [editAuto, setEditAuto] = useState<Partial<WhatsAppAutomation> | null>(null);

  const saveAutoMutation = useMutation({
    mutationFn: (auto: any) => upsertAutomation(companyId!, auto),
    onSuccess: () => {
      toast.success("Automação salva!");
      void queryClient.invalidateQueries({ queryKey: ["automations", companyId] });
      setEditAuto(null);
    },
  });

  const deleteAutoMutation = useMutation({
    mutationFn: deleteAutomation,
    onSuccess: () => {
      toast.success("Removido");
      void queryClient.invalidateQueries({ queryKey: ["automations", companyId] });
    },
  });

  // ── Quick Replies ───────────────────────────────────────

  const { data: quickReplies = [] } = useQuery({
    queryKey: ["quickReplies", companyId],
    enabled: !!companyId,
    queryFn: () => fetchQuickReplies(companyId!),
  });

  const [newShortcut, setNewShortcut] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");

  const saveQRMutation = useMutation({
    mutationFn: () => createQuickReply(companyId!, { shortcut: newShortcut, title: newTitle, body: newBody }),
    onSuccess: () => {
      toast.success("Resposta rápida criada!");
      void queryClient.invalidateQueries({ queryKey: ["quickReplies", companyId] });
      setNewShortcut("");
      setNewTitle("");
      setNewBody("");
    },
  });

  const deleteQRMutation = useMutation({
    mutationFn: deleteQuickReply,
    onSuccess: () => {
      toast.success("Removido");
      void queryClient.invalidateQueries({ queryKey: ["quickReplies", companyId] });
    },
  });

  // ── Business Hours ──────────────────────────────────────

  const { data: businessHours = [] } = useQuery({
    queryKey: ["businessHours", companyId],
    enabled: !!companyId,
    queryFn: () => fetchBusinessHours(companyId!),
  });

  const saveBHMutation = useMutation({
    mutationFn: (bh: { day_of_week: number; start_time: string; end_time: string; is_active: boolean }) =>
      upsertBusinessHour(companyId!, bh),
    onSuccess: () => {
      toast.success("Horário salvo!");
      void queryClient.invalidateQueries({ queryKey: ["businessHours", companyId] });
    },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <PageHeader title="Configurações" description="Preferências, automações e respostas rápidas" />

      <Tabs defaultValue="automations">
        <TabsList className="bg-card border border-border/50 flex flex-wrap h-auto p-1">
          <TabsTrigger value="automations" className="gap-2 text-xs">
            <Zap className="h-4 w-4" /> Automações
          </TabsTrigger>
          <TabsTrigger value="quick_replies" className="gap-2 text-xs">
            <MessageSquare className="h-4 w-4" /> Respostas Rápidas
          </TabsTrigger>
          <TabsTrigger value="business_hours" className="gap-2 text-xs">
            <Clock className="h-4 w-4" /> Horário
          </TabsTrigger>
          <TabsTrigger value="empresa" className="gap-2 text-xs">
            <Building2 className="h-4 w-4" /> Empresa
          </TabsTrigger>
          <TabsTrigger value="seguranca" className="gap-2 text-xs">
            <Shield className="h-4 w-4" /> Segurança
          </TabsTrigger>
        </TabsList>

        {/* ── Automations ──────────────────────────────────── */}
        <TabsContent value="automations" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Mensagens Automáticas</h3>
            <Button size="sm" className="gap-1.5" onClick={() => setEditAuto({ name: "", type: "welcome", message_template: "" })}>
              <Plus className="h-3.5 w-3.5" /> Nova automação
            </Button>
          </div>

          {editAuto && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    value={editAuto.name ?? ""}
                    onChange={(e) => setEditAuto({ ...editAuto, name: e.target.value })}
                    placeholder="Nome da automação"
                    className="h-9 text-sm"
                  />
                  <Select value={editAuto.type ?? "welcome"} onValueChange={(v) => setEditAuto({ ...editAuto, type: v as any })}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="welcome">Boas-vindas</SelectItem>
                      <SelectItem value="away">Ausência</SelectItem>
                      <SelectItem value="off_hours">Fora do expediente</SelectItem>
                      <SelectItem value="closing">Encerramento</SelectItem>
                      <SelectItem value="csat">Pesquisa de satisfação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  value={editAuto.message_template ?? ""}
                  onChange={(e) => setEditAuto({ ...editAuto, message_template: e.target.value })}
                  placeholder="Mensagem a ser enviada..."
                  rows={3}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" className="gap-1.5" onClick={() => saveAutoMutation.mutate(editAuto)}>
                    <Save className="h-3.5 w-3.5" /> Salvar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditAuto(null)}>Cancelar</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {automations.length === 0 ? (
              <div className="text-center py-8">
                <Zap className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma automação configurada</p>
              </div>
            ) : (
              automations.map((auto) => (
                <Card key={auto.id} className="bg-card border-border/50">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold">{auto.name}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{auto.type}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{auto.message_template}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditAuto(auto)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteAutoMutation.mutate(auto.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* ── Quick Replies ────────────────────────────────── */}
        <TabsContent value="quick_replies" className="space-y-4">
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Criar Resposta Rápida</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  value={newShortcut}
                  onChange={(e) => setNewShortcut(e.target.value.replace("/", ""))}
                  placeholder="Atalho (ex: ola, pix)"
                  className="h-9 text-sm font-mono"
                />
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Título breve"
                  className="h-9 text-sm"
                />
              </div>
              <Textarea
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="Conteúdo da mensagem..."
                rows={2}
                className="text-sm"
              />
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => saveQRMutation.mutate()}
                disabled={!newShortcut.trim() || !newBody.trim() || saveQRMutation.isPending}
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar resposta rápida
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {quickReplies.map((qr) => (
              <Card key={qr.id} className="bg-card border-border/50">
                <CardContent className="p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-primary">/{qr.shortcut}</span>
                      <span className="text-xs font-medium">{qr.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{qr.body}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteQRMutation.mutate(qr.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Business Hours ──────────────────────────────── */}
        <TabsContent value="business_hours" className="space-y-4">
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Horário de Atendimento por Dia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {DAYS_OF_WEEK.map((dayName, idx) => {
                const bh = businessHours.find((h) => h.day_of_week === idx);
                const isActive = bh?.is_active ?? (idx > 0 && idx < 6);
                const startTime = bh?.start_time ?? "09:00";
                const endTime = bh?.end_time ?? "18:00";

                return (
                  <div key={dayName} className="flex items-center justify-between gap-4 p-2.5 rounded-lg bg-accent/20">
                    <span className="text-xs font-medium w-24">{dayName}</span>
                    <Switch
                      checked={isActive}
                      onCheckedChange={(checked) =>
                        saveBHMutation.mutate({ day_of_week: idx, start_time: startTime, end_time: endTime, is_active: checked })
                      }
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={startTime}
                        onChange={(e) =>
                          saveBHMutation.mutate({ day_of_week: idx, start_time: e.target.value, end_time: endTime, is_active: isActive })
                        }
                        disabled={!isActive}
                        className="h-8 text-xs w-28"
                      />
                      <span className="text-xs text-muted-foreground">até</span>
                      <Input
                        type="time"
                        value={endTime}
                        onChange={(e) =>
                          saveBHMutation.mutate({ day_of_week: idx, start_time: startTime, end_time: e.target.value, is_active: isActive })
                        }
                        disabled={!isActive}
                        className="h-8 text-xs w-28"
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Company Tab ─────────────────────────────────── */}
        <TabsContent value="empresa">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Informações da empresa</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSaveCompany)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Nome da empresa</Label>
                    <Input {...register("name")} />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>E-mail de contato</Label>
                    <Input type="email" {...register("email")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Telefone</Label>
                    <Input placeholder="+55 11 99999-0000" {...register("phone")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Website</Label>
                    <Input placeholder="https://suaempresa.com.br" {...register("website")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Endereço</Label>
                    <Input placeholder="Cidade, Estado" {...register("address")} />
                  </div>
                </div>
                <div className="pt-2">
                  <Button type="submit" disabled={isSubmitting} className="gap-2">
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Salvar alterações
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Security Tab ────────────────────────────────── */}
        <TabsContent value="seguranca">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Segurança</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 max-w-sm">
                <div className="space-y-1.5">
                  <Label>Senha atual</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-1.5">
                  <Label>Nova senha</Label>
                  <Input type="password" placeholder="Mínimo 8 caracteres" />
                </div>
                <div className="space-y-1.5">
                  <Label>Confirmar nova senha</Label>
                  <Input type="password" placeholder="Repita a nova senha" />
                </div>
                <Button>Alterar senha</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
