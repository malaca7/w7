import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Bell, Shield, Loader2 } from "lucide-react";

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

function ConfiguracoesPage() {
  const { authUser, refresh } = useAuth();

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
    if (!authUser?.company.id) return;
    try {
      await updateCompany(authUser.company.id, {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        website: data.website || null,
        address: data.address || null,
      } as any);
      toast.success("Configurações salvas com sucesso!");
      refresh();
    } catch {
      toast.error("Erro ao salvar configurações");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <PageHeader title="Configurações" description="Preferências e configurações da empresa" />

      <Tabs defaultValue="empresa">
        <TabsList className="bg-card border border-border/50">
          <TabsTrigger value="empresa" className="gap-2">
            <Building2 className="h-4 w-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="seguranca" className="gap-2">
            <Shield className="h-4 w-4" />
            Segurança
          </TabsTrigger>
        </TabsList>

        {/* Company tab */}
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
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Telefone</Label>
                    <Input placeholder="+55 11 99999-0000" {...register("phone")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Website</Label>
                    <Input placeholder="https://suaempresa.com.br" {...register("website")} />
                    {errors.website && <p className="text-xs text-destructive">{errors.website.message}</p>}
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

        {/* Notifications tab */}
        <TabsContent value="notificacoes">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Preferências de notificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Nova conversa", desc: "Quando uma nova conversa é iniciada" },
                { label: "Mensagem recebida", desc: "Quando uma mensagem é recebida em conversas atribuídas" },
                { label: "Conversa atribuída", desc: "Quando uma conversa é atribuída a você" },
                { label: "Campanha concluída", desc: "Quando uma campanha termina o envio" },
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-9 h-5 bg-border rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security tab */}
        <TabsContent value="seguranca">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Segurança</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-3">Alterar senha</h4>
                <div className="space-y-3">
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
