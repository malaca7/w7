import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { registerWithActivationCode, resendActivationCode, resendSignupOtp, signUpWithEmail, verifyEmailOtp } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Mail, ArrowLeft } from "lucide-react";

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

function OtpStep({
  email,
  registrationData,
  onBack,
}: {
  email: string;
  registrationData: { password: string; fullName: string; companyName: string };
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const mapAuthError = (msg: string) => {
    const normalized = msg.toLowerCase();
    if (normalized.includes("rate limit") || normalized.includes("too many requests")) {
      return "Muitas tentativas. Aguarde 60 segundos para reenviar.";
    }
    if (normalized.includes("smtp") || normalized.includes("error sending")) {
      return "Falha no envio do e-mail. Verifique SMTP no Supabase.";
    }
    if (normalized.includes("expired")) {
      return "Código expirado. Solicite um novo.";
    }
    return msg;
  };

  const handleChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[i] = digit;
    setCode(next);
    if (digit && i < 5) inputs.current[i + 1]?.focus();
    if (next.every((d) => d !== "")) handleVerify(next.join(""));
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      handleVerify(pasted);
    }
    e.preventDefault();
  };

  const handleVerify = async (token: string) => {
    setLoading(true);
    try {
      await verifyEmailOtp(email, token);
      toast.success("E-mail confirmado! Bem-vindo à W7.");
      navigate({ to: "/app" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Código inválido";
      toast.error(msg.includes("expired") ? "Código expirado. Solicite um novo." : mapAuthError("Código inválido ou expirado."));
      setCode(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      try {
        await resendActivationCode({
          email,
          password: registrationData.password,
          fullName: registrationData.fullName,
          companyName: registrationData.companyName,
        });
      } catch {
        await resendSignupOtp(email);
      }
      setCode(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
      toast.success(`Novo código enviado para ${email}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao reenviar código";
      toast.error(mapAuthError(msg));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center">
            <Mail className="h-7 w-7 text-primary" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-foreground">Confirme seu e-mail</h2>
        <p className="text-sm text-muted-foreground">
          Enviamos um código de 6 dígitos para<br />
          <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-center gap-2" onPaste={handlePaste}>
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={loading}
              className="h-14 w-11 rounded-lg border border-border bg-background text-center text-xl font-bold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 transition-all"
            />
          ))}
        </div>

        {loading && (
          <div className="flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Não recebeu? Verifique a pasta de spam ou{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-primary hover:underline font-medium"
          >
            {resending ? "reenviando..." : "reenviar código"}
          </button>
        </p>

        <p className="text-center text-xs text-muted-foreground">
          Se o problema continuar, confirme as configurações de SMTP no Supabase.
        </p>
      </div>
    </div>
  );
}

function RegisterPage() {
  const [showPw, setShowPw] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [registrationData, setRegistrationData] = useState<{
    password: string;
    fullName: string;
    companyName: string;
  } | null>(null);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const pw = watch("password", "");
  const pwStrength = pw.length >= 12 ? "forte" : pw.length >= 8 ? "médio" : pw.length >= 6 ? "fraco" : "";
  const strengthColor = pwStrength === "forte" ? "bg-primary" : pwStrength === "médio" ? "bg-yellow-500" : "bg-destructive";
  const strengthWidth = pwStrength === "forte" ? "w-full" : pwStrength === "médio" ? "w-2/3" : pwStrength === "fraco" ? "w-1/3" : "w-0";

  const onSubmit = async (data: FormData) => {
    try {
      try {
        await registerWithActivationCode({
          email: data.email,
          password: data.password,
          fullName: data.full_name,
          companyName: data.company_name,
        });
      } catch {
        await signUpWithEmail(data.email, data.password, data.full_name, data.company_name);
      }
      setRegistrationData({
        password: data.password,
        fullName: data.full_name,
        companyName: data.company_name,
      });
      setRegisteredEmail(data.email);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao criar conta";
      toast.error(msg.includes("already registered") ? "Este e-mail já está cadastrado" : msg);
    }
  };

  if (registeredEmail && registrationData) {
    return (
      <OtpStep
        email={registeredEmail}
        registrationData={registrationData}
        onBack={() => {
          setRegisteredEmail(null);
          setRegistrationData(null);
        }}
      />
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
