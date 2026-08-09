import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSession } from "@/lib/auth";
import { W7Logo } from "@/components/landing/W7Logo";

export const Route = createFileRoute("/auth")({
  beforeLoad: async () => {
    const session = await getSession();
    if (session) throw redirect({ to: "/app" });
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="min-h-dvh bg-background flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[520px] xl:w-[600px] flex-col relative overflow-hidden bg-[#0D0D0D] border-r border-border/50">
        {/* Lime gradient glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(166,255,0,0.12)_0%,transparent_60%)] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full p-10">
          <W7Logo className="h-8 w-auto" />

          <div className="mt-auto">
            <blockquote className="space-y-4">
              <p className="text-2xl font-semibold leading-snug text-foreground">
                "A W7 transformou nossa operação de atendimento. Em 3 semanas aumentamos nossa satisfação de clientes em 40%."
              </p>
              <footer className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  MR
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Marcos Ribeiro</p>
                  <p className="text-xs text-muted-foreground">CEO, AgênciaMR</p>
                </div>
              </footer>
            </blockquote>

            <div className="mt-10 flex gap-8 border-t border-border/40 pt-8">
              {[
                { label: "Empresas ativas", value: "2.400+" },
                { label: "Mensagens/mês", value: "18M+" },
                { label: "Uptime", value: "99.9%" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold text-primary">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden mb-8 flex justify-center">
            <W7Logo className="h-8 w-auto" />
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
