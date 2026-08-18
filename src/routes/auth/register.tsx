import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { signUpWithEmail, checkEmailExists } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth/register")({
  component: RegisterPage,
});

const schema = z.object({
  full_name: z.string().min(2, "Informe seu nome"),
  company_name: z.string().min(2, "Informe o nome da empresa"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: "As senhas não coincidem",
  path: ["confirm_password"],
});
type FormData = z.infer<typeof schema>;

function RegisterPage() {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      // 1. Check if email is already registered
      const exists = await checkEmailExists(data.email);
      if (exists) {
        toast.error("Este e-mail já está cadastrado. Faça login para continuar.");
        return;
      }

      // 2. Sign up user & automatically sign in (no OTP required)
      await signUpWithEmail(data.email, data.password, data.full_name, data.company_name);
      
      toast.success("Conta criada com sucesso! Bem-vindo.");
      navigate({ to: "/app" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao criar conta";
      if (msg.includes("already registered") || msg.includes("already in use") || msg.includes("unique")) {
        toast.error("Este e-mail já está cadastrado.");
      } else {
        toast.error(msg);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Criar conta grátis</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preencha os dados abaixo para acessar a plataforma
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Seu nome</Label>
            <Input
              id="full_name"
              placeholder="João Silva"
              {...register("full_name")}
              className={errors.full_name ? "border-destructive" : ""}
            />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="company_name">Nome da empresa</Label>
            <Input
              id="company_name"
              placeholder="Minha Empresa Ltda"
              {...register("company_name")}
              className={errors.company_name ? "border-destructive" : ""}
            />
            {errors.company_name && <p className="text-xs text-destructive">{errors.company_name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="voce@empresa.com"
              autoComplete="email"
              {...register("email")}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                {...register("password")}
                className={errors.password ? "border-destructive pr-10" : "pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm_password">Confirmar senha</Label>
            <Input
              id="confirm_password"
              type="password"
              placeholder="Repita a senha"
              {...register("confirm_password")}
              className={errors.confirm_password ? "border-destructive" : ""}
            />
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
