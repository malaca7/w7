import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles, Brain, BookOpen, BarChart3, Plus, Trash2, Edit,
  Save, Zap, MessageSquare, Bot, Shield, ArrowRightLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { fetchAIConfig, upsertAIConfig, fetchKnowledgeBase, upsertKnowledgeEntry, deleteKnowledgeEntry, fetchAIUsage, fetchAIUsageStats } from "@/lib/gemini";
import type { AIConfig, AIKnowledgeBase } from "@/lib/supabase";

export const Route = createFileRoute("/app/ia-gemini")({
  component: IAGeminiPage,
});

function IAGeminiPage() {
  const { authUser } = useAuth();
  const companyId = authUser?.company.id;
  const queryClient = useQueryClient();

  // ── Config ─────────────────────────────────────────────

  const { data: config } = useQuery({
    queryKey: ["ai-config", companyId],
    enabled: !!companyId,
    queryFn: () => fetchAIConfig(companyId!),
  });

  const [form, setForm] = useState<Partial<AIConfig>>({});
  const activeConfig = { ...config, ...form };

  const saveConfigMutation = useMutation({
    mutationFn: () => upsertAIConfig(companyId!, form),
    onSuccess: () => {
      toast.success("Configurações da IA salvas");
      void queryClient.invalidateQueries({ queryKey: ["ai-config", companyId] });
      setForm({});
    },
    onError: () => toast.error("Erro ao salvar configurações"),
  });

  // ── Knowledge Base ─────────────────────────────────────

  const { data: knowledgeBase = [] } = useQuery({
    queryKey: ["ai-kb", companyId],
    enabled: !!companyId,
    queryFn: () => fetchKnowledgeBase(companyId!),
  });

  const [editKB, setEditKB] = useState<Partial<AIKnowledgeBase> | null>(null);

  const saveKBMutation = useMutation({
    mutationFn: (entry: Partial<AIKnowledgeBase> & { title: string; content: string }) =>
      upsertKnowledgeEntry(companyId!, entry),
    onSuccess: () => {
      toast.success("Conhecimento salvo");
      void queryClient.invalidateQueries({ queryKey: ["ai-kb", companyId] });
      setEditKB(null);
    },
  });

  const deleteKBMutation = useMutation({
    mutationFn: deleteKnowledgeEntry,
    onSuccess: () => {
      toast.success("Removido");
      void queryClient.invalidateQueries({ queryKey: ["ai-kb", companyId] });
    },
  });

  // ── Usage Stats ────────────────────────────────────────

  const { data: usageStats } = useQuery({
    queryKey: ["ai-usage-stats", companyId],
    enabled: !!companyId,
    queryFn: () => fetchAIUsageStats(companyId!),
  });

  const { data: recentUsage = [] } = useQuery({
    queryKey: ["ai-usage-recent", companyId],
    enabled: !!companyId,
    queryFn: () => fetchAIUsage(companyId!, 20),
  });

  const actionLabels: Record<string, string> = {
    auto_reply: "Resposta Automática",
    suggestion: "Sugestão",
    classify: "Classificação",
    sentiment: "Sentimento",
    summary: "Resumo",
    intent: "Intenção",
    route: "Roteamento",
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="IA Gemini"
        description="Configure o assistente de IA para atendimento automatizado"
        actions={
          <Button size="sm" className="gap-2" onClick={() => saveConfigMutation.mutate()} disabled={Object.keys(form).length === 0}>
            <Save className="h-4 w-4" />
            Salvar
          </Button>
        }
      />

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList className="bg-accent/30 border border-border/30">
          <TabsTrigger value="config" className="gap-1.5 text-xs"><Brain className="h-3.5 w-3.5" /> Configuração</TabsTrigger>
          <TabsTrigger value="knowledge" className="gap-1.5 text-xs"><BookOpen className="h-3.5 w-3.5" /> Base de Conhecimento</TabsTrigger>
          <TabsTrigger value="usage" className="gap-1.5 text-xs"><BarChart3 className="h-3.5 w-3.5" /> Uso e Consumo</TabsTrigger>
        </TabsList>

        {/* ── Config Tab ────────────────────────────────── */}
        <TabsContent value="config" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Main Settings */}
            <Card className="bg-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Ativação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">IA Habilitada</p>
                    <p className="text-xs text-muted-foreground">Ativar sugestões de IA no atendimento</p>
                  </div>
                  <Switch
                    checked={activeConfig.enabled ?? false}
                    onCheckedChange={(v) => setForm({ ...form, enabled: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Resposta Automática</p>
                    <p className="text-xs text-muted-foreground">IA responde automaticamente antes do atendente</p>
                  </div>
                  <Switch
                    checked={activeConfig.auto_reply ?? false}
                    onCheckedChange={(v) => setForm({ ...form, auto_reply: v })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Model */}
            <Card className="bg-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  Modelo e Parâmetros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium mb-1 block">Modelo Gemini</label>
                  <Select
                    value={activeConfig.model ?? "gemini-2.0-flash"}
                    onValueChange={(v) => setForm({ ...form, model: v })}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash (rápido)</SelectItem>
                      <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (avançado)</SelectItem>
                      <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (premium)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-2 block">Temperatura: {(activeConfig.temperature ?? 0.7).toFixed(1)}</label>
                  <Slider
                    value={[activeConfig.temperature ?? 0.7]}
                    onValueChange={([v]) => setForm({ ...form, temperature: v })}
                    min={0}
                    max={1}
                    step={0.1}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>Preciso</span>
                    <span>Criativo</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Máx. tokens de resposta</label>
                  <Input
                    type="number"
                    value={activeConfig.max_tokens ?? 1024}
                    onChange={(e) => setForm({ ...form, max_tokens: Number(e.target.value) })}
                    className="h-9 text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Personality */}
            <Card className="bg-card border-border/50 lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Personalidade e Contexto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium mb-1 block">Personalidade da IA</label>
                  <Textarea
                    value={activeConfig.personality ?? ""}
                    onChange={(e) => setForm({ ...form, personality: e.target.value })}
                    placeholder="Ex: Assistente profissional, amigável e objetivo..."
                    rows={2}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Instruções específicas</label>
                  <Textarea
                    value={activeConfig.instructions ?? ""}
                    onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                    placeholder="Instruções detalhadas sobre como a IA deve se comportar..."
                    rows={3}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Contexto da empresa</label>
                  <Textarea
                    value={activeConfig.context ?? ""}
                    onChange={(e) => setForm({ ...form, context: e.target.value })}
                    placeholder="Informações sobre sua empresa, produtos, serviços..."
                    rows={3}
                    className="text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Transfer Settings */}
            <Card className="bg-card border-border/50 lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4 text-primary" />
                  Transferência para Humano
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium mb-2 block">
                    Limiar de confiança para transferência: {((activeConfig.auto_transfer_threshold ?? 0.3) * 100).toFixed(0)}%
                  </label>
                  <Slider
                    value={[activeConfig.auto_transfer_threshold ?? 0.3]}
                    onValueChange={([v]) => setForm({ ...form, auto_transfer_threshold: v })}
                    min={0.1}
                    max={0.9}
                    step={0.05}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Se a confiança da IA for menor que este valor, a conversa será transferida para um humano.
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Mensagem de transferência</label>
                  <Input
                    value={activeConfig.transfer_message ?? ""}
                    onChange={(e) => setForm({ ...form, transfer_message: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Knowledge Base Tab ─────────────────────────── */}
        <TabsContent value="knowledge" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Base de Conhecimento</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Adicione informações que a IA usará para responder perguntas
              </p>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => setEditKB({ title: "", content: "", category: "general" })}>
              <Plus className="h-3.5 w-3.5" /> Adicionar
            </Button>
          </div>

          {/* Edit form */}
          {editKB && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 space-y-3">
                <Input
                  value={editKB.title ?? ""}
                  onChange={(e) => setEditKB({ ...editKB, title: e.target.value })}
                  placeholder="Título"
                  className="h-9 text-sm"
                />
                <div className="flex gap-3">
                  <Select value={editKB.category ?? "general"} onValueChange={(v) => setEditKB({ ...editKB, category: v })}>
                    <SelectTrigger className="h-9 text-sm w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Geral</SelectItem>
                      <SelectItem value="products">Produtos</SelectItem>
                      <SelectItem value="pricing">Preços</SelectItem>
                      <SelectItem value="support">Suporte</SelectItem>
                      <SelectItem value="faq">FAQ</SelectItem>
                      <SelectItem value="policies">Políticas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  value={editKB.content ?? ""}
                  onChange={(e) => setEditKB({ ...editKB, content: e.target.value })}
                  placeholder="Conteúdo do conhecimento..."
                  rows={4}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => saveKBMutation.mutate(editKB as any)}
                    disabled={!editKB.title?.trim() || !editKB.content?.trim()}
                  >
                    <Save className="h-3.5 w-3.5" /> Salvar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditKB(null)}>Cancelar</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* List */}
          <div className="space-y-2">
            {knowledgeBase.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum conhecimento adicionado</p>
              </div>
            ) : (
              knowledgeBase.map((entry) => (
                <Card key={entry.id} className="bg-card border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium">{entry.title}</p>
                          <Badge variant="outline" className="text-[10px] capitalize">{entry.category}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{entry.content}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditKB(entry)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteKBMutation.mutate(entry.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* ── Usage Tab ──────────────────────────────────── */}
        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card border-border/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{usageStats?.totalInteractions ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Total interações</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{((usageStats?.totalTokens ?? 0) / 1000).toFixed(1)}k</p>
                <p className="text-xs text-muted-foreground mt-0.5">Tokens usados</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{usageStats?.byAction?.suggestion ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Sugestões</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{usageStats?.byAction?.auto_reply ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Respostas auto</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent usage */}
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recentUsage.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Nenhuma atividade registrada</p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {recentUsage.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Zap className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium">{actionLabels[log.action] ?? log.action}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {log.input_tokens + log.output_tokens} tokens · {log.model}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(log.created_at).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
