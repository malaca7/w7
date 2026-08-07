import { motion } from "motion/react";
import { ArrowRight, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import dashboardHero from "@/assets/dashboard-hero.jpg";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-36 pb-20 sm:pt-44">
      {/* aurora + grid background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 size-[42rem] -translate-x-1/2 rounded-full blur-[140px] animate-aurora"
        style={{ background: "radial-gradient(circle, oklch(0.9 0.24 128 / 28%), transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-background to-transparent"
      />

      <div className="relative mx-auto max-w-6xl px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            Atendimento inteligente multi-empresa no WhatsApp
          </span>

          <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            A plataforma <span className="text-gradient">premium</span> de atendimento via WhatsApp
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
            CRM, chatbot visual, campanhas, financeiro e assinaturas em um único ambiente — rápido,
            isolado por empresa e pronto para escalar.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button variant="brand" size="xl">
              Começar teste grátis
              <ArrowRight className="size-4" />
            </Button>
            <Button variant="subtle" size="xl">
              Ver demonstração
            </Button>
          </div>

          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <li className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-primary" /> Dados isolados por empresa
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Zap className="size-3.5 text-primary" /> Setup em minutos
            </li>
            <li>Sem cartão de crédito</li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: 8 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto mt-16 max-w-5xl"
        >
          <div className="rounded-3xl glass p-2 shadow-[var(--shadow-elevated)]">
            <img
              src={dashboardHero}
              width={1600}
              height={1008}
              alt="Painel W7 com caixa de entrada do WhatsApp, conversas e métricas de atendimento"
              className="w-full rounded-2xl"
            />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-10 -bottom-10 h-40 blur-[90px]"
            style={{ background: "radial-gradient(50% 100% at 50% 0%, oklch(0.9 0.24 128 / 22%), transparent)" }}
          />
        </motion.div>
      </div>
    </section>
  );
}
