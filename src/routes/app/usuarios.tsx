import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { getSupabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, Shield, Eye, Headphones, MoreHorizontal, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/app/usuarios")({
  component: UsuariosPage,
});

const roleConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  owner: { label: "Proprietário", color: "text-yellow-500 bg-yellow-500/10", icon: Shield },
  admin: { label: "Admin", color: "text-primary bg-primary/10", icon: Shield },
  supervisor: { label: "Supervisor", color: "text-blue-400 bg-blue-400/10", icon: Eye },
  attendant: { label: "Atendente", color: "text-muted-foreground bg-muted/50", icon: Headphones },
};

function UsuariosPage() {
  const { authUser } = useAuth();
  const [showInvite, setShowInvite] = useState(false);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["profiles", authUser?.company.id],
    enabled: !!authUser?.company.id,
    queryFn: async () => {
      const sb = getSupabase();
      if (!sb) return [];
      const { data } = await sb
        .from("profiles")
        .select("*")
        .eq("company_id", authUser!.company.id)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Usuários e Atendentes"
        description={`${profiles.length} membros da equipe`}
        actions={
          <Button size="sm" className="gap-2" onClick={() => setShowInvite(true)}>
            <UserPlus className="h-4 w-4" />
            Convidar usuário
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-card animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-card/50 hover:bg-card/50">
                <TableHead>Usuário</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile: any) => {
                const role = roleConfig[profile.role] ?? roleConfig.attendant;
                const initials = profile.full_name?.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() ?? "??";
                const isMe = profile.id === authUser?.profile.id;
                return (
                  <TableRow key={profile.id} className="hover:bg-card/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={profile.avatar_url} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium flex items-center gap-1.5">
                            {profile.full_name ?? "—"}
                            {isMe && <span className="text-[10px] text-muted-foreground">(você)</span>}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 w-fit", role.color)}>
                        <role.icon className="h-3 w-3" />
                        {role.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">—</TableCell>
                    <TableCell>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        profile.is_active ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground",
                      )}>
                        {profile.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {!isMe && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Alterar função</DropdownMenuItem>
                            <DropdownMenuItem>Alterar departamento</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                              {profile.is_active ? "Desativar" : "Ativar"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Convidar usuário</h3>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowInvite(false)}>×</Button>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      placeholder="usuario@empresa.com"
                      className="w-full h-9 pl-9 pr-3 rounded-lg border border-border/50 bg-background text-sm focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Função</label>
                  <select className="w-full h-9 px-3 rounded-lg border border-border/50 bg-background text-sm focus:outline-none focus:border-primary/50">
                    <option value="attendant">Atendente</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowInvite(false)}>Cancelar</Button>
                <Button className="flex-1 gap-2" onClick={() => setShowInvite(false)}>
                  <UserPlus className="h-4 w-4" />
                  Enviar convite
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
