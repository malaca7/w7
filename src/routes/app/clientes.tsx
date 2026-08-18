import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Search, Plus, Users, Phone, Mail, Building2, MapPin,
  Pencil, Trash2, X, Tag, FileText, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { fetchContacts, upsertContact } from "@/lib/whatsapp-db";
import type { Contact } from "@/lib/supabase";

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
  const companyId = authUser?.company.id;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [editingContact, setEditingContact] = useState<Partial<Contact> | null>(null);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["contacts", companyId],
    enabled: !!companyId,
    queryFn: () => fetchContacts(companyId!),
  });

  const saveMutation = useMutation({
    mutationFn: (contact: Partial<Contact> & { name: string }) => upsertContact(companyId!, contact),
    onSuccess: () => {
      toast.success("Contato salvo com sucesso!");
      void queryClient.invalidateQueries({ queryKey: ["contacts", companyId] });
      setEditingContact(null);
    },
    onError: () => toast.error("Erro ao salvar contato"),
  });

  const filtered = contacts.filter((c) => {
    if (stageFilter !== "all" && c.stage !== stageFilter) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(s) ||
        (c.phone ?? "").includes(s) ||
        (c.email ?? "").toLowerCase().includes(s) ||
        (c.company_name ?? "").toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Clientes / CRM"
        description={`${contacts.length} contatos cadastrados`}
        actions={
          <Button size="sm" className="gap-2" onClick={() => setEditingContact({ name: "", stage: "lead" })}>
            <Plus className="h-4 w-4" />
            Novo contato
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail, telefone ou empresa…"
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-36 h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os estágios</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="prospect">Prospect</SelectItem>
            <SelectItem value="customer">Cliente</SelectItem>
            <SelectItem value="churned">Churn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="h-14 w-14 text-muted-foreground/20 mb-4" />
          <p className="text-sm text-muted-foreground">Nenhum contato encontrado</p>
          <Button className="mt-4 gap-2" size="sm" onClick={() => setEditingContact({ name: "", stage: "lead" })}>
            <Plus className="h-4 w-4" />
            Adicionar contato
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 overflow-hidden bg-card/30">
          <Table>
            <TableHeader>
              <TableRow className="bg-card/50 hover:bg-card/50">
                <TableHead>Nome / Empresa</TableHead>
                <TableHead>WhatsApp / Telefone</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Estágio</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((contact) => {
                const stage = stageConfig[contact.stage] ?? stageConfig.lead;
                return (
                  <TableRow key={contact.id} className="hover:bg-card/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                          {contact.avatar_url ? (
                            <img src={contact.avatar_url} className="h-full w-full rounded-full object-cover" alt="" />
                          ) : (
                            contact.name[0]?.toUpperCase() ?? "?"
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{contact.name}</p>
                          {contact.company_name && (
                            <p className="text-xs text-muted-foreground">{contact.company_name}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {contact.whatsapp || contact.phone ? (
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {contact.whatsapp || contact.phone}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {contact.email ? (
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          {contact.email}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stage.color}`}>
                        {stage.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {contact.city ? `${contact.city}${contact.state ? `/${contact.state}` : ""}` : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setEditingContact(contact)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal Edit/Create Contact */}
      {editingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border/50 rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">
                {editingContact.id ? "Editar Contato" : "Novo Contato"}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setEditingContact(null)} className="h-7 w-7 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-medium mb-1 block">Nome completo *</label>
                <Input
                  value={editingContact.name ?? ""}
                  onChange={(e) => setEditingContact({ ...editingContact, name: e.target.value })}
                  placeholder="Nome do cliente"
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Telefone / WhatsApp</label>
                <Input
                  value={editingContact.phone ?? editingContact.whatsapp ?? ""}
                  onChange={(e) => setEditingContact({ ...editingContact, phone: e.target.value, whatsapp: e.target.value })}
                  placeholder="+55 11 99999-9999"
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">E-mail</label>
                <Input
                  type="email"
                  value={editingContact.email ?? ""}
                  onChange={(e) => setEditingContact({ ...editingContact, email: e.target.value })}
                  placeholder="cliente@email.com"
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Empresa</label>
                <Input
                  value={editingContact.company_name ?? ""}
                  onChange={(e) => setEditingContact({ ...editingContact, company_name: e.target.value })}
                  placeholder="Nome da empresa"
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Estágio CRM</label>
                <Select
                  value={editingContact.stage ?? "lead"}
                  onValueChange={(v) => setEditingContact({ ...editingContact, stage: v })}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="customer">Cliente</SelectItem>
                    <SelectItem value="churned">Churn</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">CPF / CNPJ</label>
                <Input
                  value={editingContact.cpf_cnpj ?? ""}
                  onChange={(e) => setEditingContact({ ...editingContact, cpf_cnpj: e.target.value })}
                  placeholder="000.000.000-00"
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Cidade / UF</label>
                <div className="flex gap-2">
                  <Input
                    value={editingContact.city ?? ""}
                    onChange={(e) => setEditingContact({ ...editingContact, city: e.target.value })}
                    placeholder="Cidade"
                    className="h-9 text-sm flex-1"
                  />
                  <Input
                    value={editingContact.state ?? ""}
                    onChange={(e) => setEditingContact({ ...editingContact, state: e.target.value })}
                    placeholder="UF"
                    className="h-9 text-sm w-16"
                  />
                </div>
              </div>

              <div className="col-span-2">
                <label className="text-xs font-medium mb-1 block">Observações / Notas CRM</label>
                <Textarea
                  value={editingContact.notes ?? ""}
                  onChange={(e) => setEditingContact({ ...editingContact, notes: e.target.value })}
                  placeholder="Observações internas sobre este cliente..."
                  rows={3}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditingContact(null)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={() => saveMutation.mutate(editingContact as any)}
                disabled={!editingContact.name?.trim() || saveMutation.isPending}
              >
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar contato
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
