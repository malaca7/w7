import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { signUpWithEmail } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/auth/register")({
  component: RegisterPage,
});

const schema = z.object({
  full_name: z.string().min(2, "Nome muito curto"),
  company_name: z.string().min(2, "Nome da empresa muito curto"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: "Senhas não coincidem",
  path: ["confirm_password"],
});
type FormData = z.infer<typeof schema>;

function RegisterPage() {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const pw = watch("password", "");
  const pwStrength = pw.length >= 12 ? "forte" : pw.length >= 8 ? "médio" : pw.length >= 6 ? "fraco" : "";
  const strengthColor = pwStrength === "forte" ? "bg-primary" : pwStrength === "médio" ? "bg-yellow-500" : "bg-destructive";
  const strengthWidth = pwStrength === "forte" ? "w-full" : pwStrength === "médio" ? "w-2/3" : pwStrength === "fraco" ? "w-1/3" : "w-0";

  const onSubmit = async (data: FormData) => {
    try {
      await signUpWithEmail(data.email, data.password, data.full_name, data.company_name);
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao criar conta";
      toast.error(msg.includes("already registered") ? "Este e-mail já está cadastrado" : msg);
    }
  };

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-primary/15 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Verifique seu e-mail</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enviamos um link de confirmação para o seu e-mail. Clique nele para ativar sua conta e começar a usar a W7.
          </p>
        </div>
        <Link to="/auth/login" className="block">
          <Button variant="outline" className="w-full">Voltar ao login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Criar conta grátis</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          14 dias de trial sem cartão de crédito
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Seu nome</Label>
            <Input id="full_name" placeholder="João Silva" {...register("full_name")} />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="company_name">Nome da empresa</Label>
            <Input id="company_name" placeholder="Minha Empresa Ltda" {...register("company_name")} />
            {errors.company_name && <p className="text-xs text-destructive">{errors.company_name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" placeholder="voce@empresa.com" autoComplete="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
                {...register("password")}
                className="pr-10"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {pw.length > 0 && (
              <div className="space-y-1">
                <div className="h-1 w-full bg-border rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${strengthWidth} ${strengthColor}`} />
                </div>
                <p className="text-xs text-muted-foreground">Força: <span className="font-medium text-foreground">{pwStrength}</span></p>
              </div>
            )}
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm_password">Confirmar senha</Label>
            <Input id="confirm_password" type="password" placeholder="Repita a senha" {...register("confirm_password")} />
            {errors.confirm_password && <p className="text-xs text-destructive">{errors.confirm_password.message}</p>}
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Criar conta
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Ao criar uma conta você concorda com os{" "}
          <a href="#" className="text-primary hover:underline">Termos de Uso</a>
          {" "}e a{" "}
          <a href="#" className="text-primary hover:underline">Política de Privacidade</a>.
        </p>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Já tem uma conta?{" "}
        <Link to="/auth/login" className="text-primary font-medium hover:underline">
          Fazer login
        </Link>
      </p>
    </div>
  );
}
