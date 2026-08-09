import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { getSupabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Plus, Users, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/app/departamentos")({
  component: DepartamentosPage,
});

function DepartamentosPage() {
  const { authUser } = useAuth();

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ["departments", authUser?.company.id],
    enabled: !!authUser?.company.id,
    queryFn: async () => {
      const sb = getSupabase();
      if (!sb) return [];
      const { data } = await sb
        .from("departments")
        .select("*")
        .eq("company_id", authUser!.company.id)
        .order("name", { ascending: true });
      return data ?? [];
    },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Departamentos"
        description="Organize sua equipe em departamentos"
        actions={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Novo departamento
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-card animate-pulse" />
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
          <Button className="mt-6 gap-2">
            <Plus className="h-4 w-4" />
            Criar departamento
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept: any) => (
            <Card key={dept.id} className="bg-card border-border/50 hover:border-border transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-9 w-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: (dept.color ?? "#A6FF00") + "20" }}
                    >
                      <Building2 className="h-4.5 w-4.5" style={{ color: dept.color ?? "#A6FF00" }} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{dept.name}</p>
                      {dept.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{dept.description}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 flex-1">
                    <Pencil className="h-3 w-3" />
                    Editar
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          <button className="rounded-xl border-2 border-dashed border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary">
            <Plus className="h-6 w-6" />
            <span className="text-sm font-medium">Novo departamento</span>
          </button>
        </div>
      )}
    </div>
  );
}
