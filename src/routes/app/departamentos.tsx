import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Plus, Pencil, Trash2, X, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { getSupabase } from "@/lib/supabase";
import { fetchDepartments } from "@/lib/whatsapp-db";
import type { Department } from "@/lib/supabase";

export const Route = createFileRoute("/app/departamentos")({
  component: DepartamentosPage,
});

const PRESET_COLORS = [
  "#A6FF00", "#50C800", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#EF4444", "#10B981", "#06B6D4",
];

function DepartamentosPage() {
  const { authUser } = useAuth();
  const companyId = authUser?.company.id;
  const queryClient = useQueryClient();

  const [editingDept, setEditingDept] = useState<Partial<Department> | null>(null);

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ["departments", companyId],
    enabled: !!companyId,
    queryFn: () => fetchDepartments(companyId!),
  });

  const saveMutation = useMutation({
    mutationFn: async (dept: Partial<Department> & { name: string }) => {
      const sb = getSupabase();
      if (!sb) return;
      const payload = { company_id: companyId, color: dept.color ?? "#A6FF00", ...dept };
      const { data, error } = dept.id
        ? await sb.from("departments").update(payload).eq("id", dept.id).select().single()
        : await sb.from("departments").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Departamento salvo!");
      void queryClient.invalidateQueries({ queryKey: ["departments", companyId] });
      setEditingDept(null);
    },
    onError: () => toast.error("Erro ao salvar departamento"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabase();
      if (!sb) return;
      const { error } = await sb.from("departments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Departamento removido");
      void queryClient.invalidateQueries({ queryKey: ["departments", companyId] });
    },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Departamentos"
        description="Organize sua equipe em setores e filas de atendimento"
        actions={
          <Button size="sm" className="gap-2" onClick={() => setEditingDept({ name: "", color: "#A6FF00" })}>
            <Plus className="h-4 w-4" />
            Novo departamento
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 rounded-xl bg-card animate-pulse" />
          ))}
        </div>
      ) : departments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <Building2 className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Nenhum departamento criado</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            Crie departamentos para organizar atendentes e direcionar conversas automaticamente.
          </p>
          <Button className="mt-6 gap-2" onClick={() => setEditingDept({ name: "", color: "#A6FF00" })}>
            <Plus className="h-4 w-4" />
            Criar departamento
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <Card key={dept.id} className="bg-card border-border/50 hover:border-border transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: (dept.color ?? "#A6FF00") + "20" }}
                    >
                      <Building2 className="h-5 w-5" style={{ color: dept.color ?? "#A6FF00" }} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{dept.name}</p>
                      {dept.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{dept.description}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/40">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 flex-1" onClick={() => setEditingDept(dept)}>
                    <Pencil className="h-3 w-3" />
                    Editar
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(dept.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          <button
            onClick={() => setEditingDept({ name: "", color: "#A6FF00" })}
            className="rounded-xl border-2 border-dashed border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary min-h-[140px]"
          >
            <Plus className="h-6 w-6" />
            <span className="text-sm font-medium">Novo departamento</span>
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {editingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border/50 rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">
                {editingDept.id ? "Editar Departamento" : "Novo Departamento"}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setEditingDept(null)} className="h-7 w-7 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1 block">Nome do departamento *</label>
                <Input
                  value={editingDept.name ?? ""}
                  onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
                  placeholder="Ex: Vendas, Suporte, Financeiro…"
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Descrição</label>
                <Textarea
                  value={editingDept.description ?? ""}
                  onChange={(e) => setEditingDept({ ...editingDept, description: e.target.value })}
                  placeholder="Descrição opcional..."
                  rows={2}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-2 block">Cor do departamento</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditingDept({ ...editingDept, color: c })}
                      className="h-7 w-7 rounded-full flex items-center justify-center border-2 border-transparent hover:scale-110 transition-transform"
                      style={{ backgroundColor: c }}
                    >
                      {editingDept.color === c && <Check className="h-4 w-4 text-black" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditingDept(null)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={() => saveMutation.mutate(editingDept as any)}
                disabled={!editingDept.name?.trim() || saveMutation.isPending}
              >
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
