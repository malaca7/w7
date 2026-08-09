import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { updateProfile } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Camera, Loader2, Shield } from "lucide-react";

export const Route = createFileRoute("/app/perfil")({
  component: PerfilPage,
});

const profileSchema = z.object({
  full_name: z.string().min(2, "Nome muito curto"),
});
type ProfileForm = z.infer<typeof profileSchema>;

const roleLabels: Record<string, string> = {
  owner: "Proprietário",
  admin: "Admin",
  supervisor: "Supervisor",
  attendant: "Atendente",
};

function PerfilPage() {
  const { authUser, refresh } = useAuth();
  const [uploading, setUploading] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: authUser?.profile.full_name ?? "" },
  });

  const initials = authUser?.profile.full_name
    ? authUser.profile.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "W7";

  const onSave = async (data: ProfileForm) => {
    if (!authUser?.profile.id) return;
    try {
      await updateProfile(authUser.profile.id, { full_name: data.full_name });
      toast.success("Perfil atualizado!");
      refresh();
    } catch {
      toast.error("Erro ao salvar perfil");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authUser) return;

    const sb = getSupabase();
    if (!sb) return;

    setUploading(true);
    try {
      const path = `avatars/${authUser.profile.id}/${Date.now()}.${file.name.split(".").pop()}`;
      const { error: uploadError } = await sb.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = sb.storage.from("avatars").getPublicUrl(path);
      await updateProfile(authUser.profile.id, { avatar_url: publicUrl });
      toast.success("Foto atualizada!");
      refresh();
    } catch {
      toast.error("Erro ao atualizar foto");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <PageHeader title="Meu Perfil" description="Gerencie suas informações pessoais" />

      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Foto e informações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={authUser?.profile.avatar_url ?? undefined} />
                <AvatarFallback className="text-xl bg-primary/20 text-primary font-bold">{initials}</AvatarFallback>
              </Avatar>
              <label className={`absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary/80 transition-colors ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}>
                {uploading ? <Loader2 className="h-3.5 w-3.5 text-primary-foreground animate-spin" /> : <Camera className="h-3.5 w-3.5 text-primary-foreground" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            </div>
            <div>
              <p className="font-semibold">{authUser?.profile.full_name ?? "—"}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs gap-1.5">
                  <Shield className="h-3 w-3" />
                  {roleLabels[authUser?.profile.role ?? "attendant"] ?? authUser?.profile.role}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {authUser?.company.name}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{authUser?.user.email}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome completo</Label>
              <Input {...register("full_name")} />
              {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input value={authUser?.user.email ?? ""} disabled className="opacity-60" />
              <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado por aqui.</p>
            </div>

            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar alterações
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account info */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Informações da conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">ID do usuário</span>
            <span className="font-mono text-xs text-foreground">{authUser?.profile.id.slice(0, 8)}…</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Empresa</span>
            <span>{authUser?.company.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Membro desde</span>
            <span>{authUser?.profile.created_at ? new Date(authUser.profile.created_at).toLocaleDateString("pt-BR") : "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Plano</span>
            <span className="capitalize text-primary font-medium">{authUser?.company.plan}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
