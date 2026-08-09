import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { getSupabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, Plus, Users, Phone, Mail, Tag } from "lucide-react";

export const Route = createFileRoute("/app/clientes")({
  component: ClientesPage,
});

const stageConfig: Record<string, { label: string; color: string }> = {
  lead: { label: "Lead", color: "bg-blue-500/10 text-blue-400" },
  prospect: { label: "Prospect", color: "bg-yellow-500/10 text-yellow-500" },
  customer: { label: "Cliente", color: "bg-primary/10 text-primary" },
  churned: { label: "Churn", color: "bg-destructive/10 text-destructive" },
};

function ClientesPage() {
  const { authUser } = useAuth();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"table" | "cards">("table");

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["contacts", authUser?.company.id],
    enabled: !!authUser?.company.id,
    queryFn: async () => {
      const sb = getSupabase();
      if (!sb) return [];
      const { data } = await sb
        .from("contacts")
        .select("*")
        .eq("company_id", authUser!.company.id)
        .order("created_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });

  const filtered = contacts.filter((c: any) =>
    search ? (c.name + " " + (c.email ?? "") + " " + (c.phone ?? "")).toLowerCase().includes(search.toLowerCase()) : true,
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Clientes / CRM"
        description={`${contacts.length} contatos`}
        actions={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Novo contato
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou telefone…"
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="h-14 w-14 text-muted-foreground/20 mb-4" />
          <p className="text-sm text-muted-foreground">Nenhum contato encontrado</p>
          <Button className="mt-4 gap-2" size="sm">
            <Plus className="h-4 w-4" />
            Adicionar contato
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-card/50 hover:bg-card/50">
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Estágio</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((contact: any) => {
                const stage = stageConfig[contact.stage] ?? stageConfig.lead;
                return (
                  <TableRow key={contact.id} className="hover:bg-card/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                          {contact.name?.[0] ?? "?"}
                        </div>
                        <span className="font-medium text-sm">{contact.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {contact.email ? (
                        <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 hover:text-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          {contact.email}
                        </a>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {contact.phone ? (
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          {contact.phone}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stage.color}`}>
                        {stage.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {(contact.tags ?? []).slice(0, 3).map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-[10px] h-4 px-1.5">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-7 text-xs">Ver</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
