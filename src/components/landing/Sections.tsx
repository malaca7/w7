import {
  MessageSquare,
  Users,
  Bot,
  CalendarClock,
  Wallet,
  BarChart3,
  QrCode,
  Building2,
  Send,
  ShieldCheck,
} from "lucide-react";
import { Reveal } from "./Reveal";

const features = [
  {
    icon: MessageSquare,
    title: "Central de atendimento",
    desc: "Filas, status, etiquetas, notas internas, transferência, anexos e áudio em tempo real.",
  },
  {
    icon: Users,
    title: "CRM completo",
    desc: "Ficha do cliente, histórico, origem, etiquetas e tempo de relacionamento.",
  },
  {
    icon: Bot,
    title: "Chatbot visual",
    desc: "Editor drag-and-drop com menus, condições, filas, horário comercial e fallback.",
  },
  {
    icon: CalendarClock,
    title: "Agendador",
    desc: "Envios únicos ou recorrentes: diário, semanal, mensal e aniversário.",
  },
  {
    icon: Wallet,
    title: "Financeiro",
    desc: "Receitas, despesas, fluxo de caixa, boletos, PIX, cartão e centro de custos.",
  },
  {
    icon: BarChart3,
    title: "Dashboards",
    desc: "Atendimentos, tempo médio, conversões e receita com gráficos em tempo real.",
  },
  {
    icon: QrCode,
    title: "Multi-números",
    desc: "Conexão por QR Code com reconexão automática ou API Oficial da Meta.",
  },
  {
    icon: Building2,
    title: "Multi-tenant",
    desc: "Cada empresa com ambiente, usuários, permissões e dados totalmente isolados.",
  },
];

export function Features() {
  return (
    <section id="recursos" className="relative py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Tudo que sua operação precisa, <span className="text-gradient">em um só lugar</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Módulos independentes que conversam entre si, construídos para times de atendimento que
            crescem rápido.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.05}>
              <article className="group h-full rounded-2xl glass p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40">
                <span className="grid size-10 place-items-center rounded-xl bg-accent text-primary transition-shadow group-hover:shadow-[var(--shadow-glow)]">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-sm font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const integrations = [
  "WhatsApp Business API",
  "Meta Cloud API",
  "Stripe",
  "Mercado Pago",
  "Asaas",
  "PIX",
  "Google Calendar",
  "Webhooks",
  "Zapier",
  "n8n",
  "Supabase",
  "OpenAI",
];

export function Integrations() {
  return (
    <section id="integracoes" className="relative py-20">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Integrações nativas e abertas
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Conecte pagamentos, agenda e automações. API e webhooks disponíveis para o seu stack.
          </p>
        </Reveal>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {integrations.map((name, i) => (
            <Reveal key={name} delay={i * 0.03}>
              <span className="inline-flex items-center gap-2 rounded-xl glass px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                <ShieldCheck className="size-3.5 text-primary" />
                {name}
              </span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    icon: Building2,
    title: "Crie sua empresa",
    desc: "Ambiente isolado provisionado com usuários, departamentos e permissões.",
  },
  {
    icon: QrCode,
    title: "Conecte seus números",
    desc: "QR Code em segundos ou API Oficial da Meta. Vários números simultâneos.",
  },
  {
    icon: Bot,
    title: "Monte o fluxo",
    desc: "Chatbot visual, respostas rápidas e roteamento por departamento.",
  },
  {
    icon: Send,
    title: "Atenda e escale",
    desc: "Métricas, campanhas e financeiro acompanhando o crescimento.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="relative py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Como funciona
          </h2>
          <p className="mt-4 text-muted-foreground">Do cadastro ao primeiro atendimento em minutos.</p>
        </Reveal>

        <ol className="mt-12 grid gap-4 md:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.08}>
              <li className="relative h-full rounded-2xl glass p-6">
                <span className="text-xs font-mono text-primary">0{i + 1}</span>
                <s.icon className="mt-4 size-5 text-primary" />
                <h3 className="mt-3 text-sm font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
