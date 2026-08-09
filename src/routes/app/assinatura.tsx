import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Zap, Building2, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/assinatura")({
  component: AssinaturaPage,
});

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: 97,
    description: "Ideal para pequenas empresas",
    features: [
      "3 conexões WhatsApp",
      "5 atendentes",
      "5.000 mensagens/mês",
      "CRM básico",
      "Relatórios simples",
      "Suporte via chat",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 197,
    description: "Para empresas em crescimento",
    popular: true,
    features: [
      "10 conexões WhatsApp",
      "20 atendentes",
      "50.000 mensagens/mês",
      "CRM avançado",
      "Chatbot visual",
      "Campanhas ilimitadas",
      "Relatórios avançados",
      "Suporte prioritário",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 497,
    description: "Para grandes operações",
    features: [
      "Conexões ilimitadas",
      "Atendentes ilimitados",
      "Mensagens ilimitadas",
      "CRM completo + API",
      "Chatbot com IA",
      "Campanhas ilimitadas",
      "Relatórios personalizados",
      "SLA garantido",
      "Onboarding dedicado",
      "Gerente de conta",
    ],
  },
];

function AssinaturaPage() {
  const { authUser } = useAuth();
  const currentPlan = authUser?.company.plan ?? "trial";
  const trialEnd = authUser?.company.trial_ends_at;
  const trialDays = trialEnd
    ? Math.max(0, Math.ceil((new Date(trialEnd).getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <PageHeader title="Assinatura e Plano" description="Gerencie sua assinatura W7" />

      {currentPlan === "trial" && (
        <div className="rounded-xl bg-primary/10 border border-primary/20 p-5 flex items-center gap-4">
          <Zap className="h-8 w-8 text-primary shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-primary">Trial ativo — {trialDays} dias restantes</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Escolha um plano abaixo para continuar usando a W7 após o período de teste.
            </p>
          </div>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const isActive = currentPlan === plan.id;
          return (
            <Card
              key={plan.id}
              className={cn(
                "bg-card border transition-all relative",
                plan.popular ? "border-primary shadow-lg shadow-primary/10" : "border-border/50",
                isActive && "ring-1 ring-primary",
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Mais popular
                  </span>
                </div>
              )}
              <CardHeader className="pt-6">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
                <div className="mt-2">
                  <span className="text-3xl font-bold">R$ {plan.price}</span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {isActive ? (
                  <Button disabled className="w-full" variant="outline">
                    Plano atual
                  </Button>
                ) : (
                  <Button className={cn("w-full gap-2", plan.popular ? "" : "variant-outline")} variant={plan.popular ? "default" : "outline"}>
                    Assinar {plan.name}
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Current subscription info */}
      {currentPlan !== "trial" && (
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Detalhes da assinatura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Plano atual</p>
                <p className="font-semibold capitalize mt-0.5">{currentPlan}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-semibold mt-0.5 text-primary">{authUser?.company.plan_status}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Building2 className="h-4 w-4" />
                Gerenciar pagamento
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                Cancelar assinatura
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
