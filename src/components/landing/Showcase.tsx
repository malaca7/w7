import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Star, Check } from "lucide-react";
import { Reveal } from "./Reveal";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const chartData = [
  { d: "Seg", atendimentos: 320, receita: 4200 },
  { d: "Ter", atendimentos: 410, receita: 5100 },
  { d: "Qua", atendimentos: 380, receita: 4800 },
  { d: "Qui", atendimentos: 520, receita: 6400 },
  { d: "Sex", atendimentos: 610, receita: 7900 },
  { d: "Sáb", atendimentos: 450, receita: 5600 },
  { d: "Dom", atendimentos: 290, receita: 3900 },
];

const kpis = [
  { label: "Atendimentos", value: "2.980", delta: "+18%" },
  { label: "Tempo médio", value: "1m 42s", delta: "-12%" },
  { label: "Clientes ativos", value: "1.204", delta: "+9%" },
  { label: "Receita", value: "R$ 37,9k", delta: "+24%" },
];

export function DashboardShowcase() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Indicadores em <span className="text-gradient">tempo real</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Acompanhe volume, produtividade e receita sem sair da plataforma.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-10 rounded-3xl glass p-5 sm:p-7">
            <div className="grid gap-3 sm:grid-cols-4">
              {kpis.map((k) => (
                <div key={k.label} className="rounded-2xl bg-surface-2/60 p-4">
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className="mt-1.5 text-xl font-semibold">{k.value}</p>
                  <p className="mt-1 text-xs text-primary">{k.delta} vs. semana anterior</p>
                </div>
              ))}
            </div>

            <div className="mt-5 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: -20, right: 8, top: 10 }}>
                  <defs>
                    <linearGradient id="w7Area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="d" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 14,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="atendimentos"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2}
                    fill="url(#w7Area)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const testimonials = [
  {
    quote:
      "Reduzimos o tempo de primeira resposta de 8 minutos para menos de 1. A equipe inteira migrou em um dia.",
    name: "Marina Duarte",
    role: "Head de CX, Nuvem Retail",
  },
  {
    quote:
      "O chatbot visual resolveu 60% dos atendimentos sozinho. O financeiro integrado eliminou duas planilhas.",
    name: "Rafael Lima",
    role: "COO, Clínica Vitha",
  },
  {
    quote:
      "Gerenciamos 14 números e 40 atendentes com dados separados por unidade. Nunca tivemos vazamento.",
    name: "Camila Reis",
    role: "Diretora, Grupo Anthea",
  },
];

export function Testimonials() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Times que já operam na <span className="font-bold text-gradient">W7</span>
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <figure className="h-full rounded-2xl glass p-6 transition-colors hover:border-primary/40">
                <div className="flex gap-0.5 text-primary" aria-label="5 de 5 estrelas">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="size-3.5 fill-current" aria-hidden />
                  ))}
                </div>
                <blockquote className="mt-4 text-sm leading-relaxed text-foreground/90">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{t.name}</span> · {t.role}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const plans = [
  {
    name: "Free",
    monthly: 0,
    yearly: 0,
    desc: "Para testar a operação.",
    items: ["1 número", "1 atendente", "CRM básico", "500 mensagens/mês"],
  },
  {
    name: "Starter",
    monthly: 97,
    yearly: 77,
    desc: "Pequenos times.",
    items: ["2 números", "3 atendentes", "Respostas rápidas", "Agendador"],
  },
  {
    name: "Professional",
    monthly: 197,
    yearly: 157,
    desc: "O mais escolhido.",
    highlight: true,
    items: ["5 números", "10 atendentes", "Chatbot visual", "Campanhas", "Financeiro"],
  },
  {
    name: "Business",
    monthly: 397,
    yearly: 317,
    desc: "Operações grandes.",
    items: ["15 números", "30 atendentes", "API e webhooks", "Relatórios avançados"],
  },
  {
    name: "Enterprise",
    monthly: null,
    yearly: null,
    desc: "Sob medida.",
    items: ["Números ilimitados", "SLA dedicado", "SSO", "Onboarding assistido"],
  },
];

export function Pricing() {
  const [yearly, setYearly] = useState(true);

  return (
    <section id="planos" className="relative py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Planos que acompanham o seu crescimento
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Cobrança por atendentes, números e recursos. Troque de plano quando quiser.
          </p>
          <div
            role="group"
            aria-label="Periodicidade de cobrança"
            className="mt-7 inline-flex rounded-xl glass p-1"
          >
            {[
              { label: "Mensal", val: false },
              { label: "Anual · -20%", val: true },
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                onClick={() => setYearly(o.val)}
                aria-pressed={yearly === o.val}
                className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
                  yearly === o.val
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {plans.map((p, i) => {
            const price = yearly ? p.yearly : p.monthly;
            return (
              <Reveal key={p.name} delay={i * 0.06} className="h-full">
                <article
                  className={`flex h-full flex-col rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 ${
                    p.highlight
                      ? "glass border-primary/50 shadow-[var(--shadow-glow)]"
                      : "glass hover:border-primary/30"
                  }`}
                >
                  {p.highlight && (
                    <span className="mb-3 w-fit rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                      Mais popular
                    </span>
                  )}
                  <h3 className="text-sm font-semibold">{p.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{p.desc}</p>
                  <p className="mt-5 text-2xl font-semibold">
                    {price === null ? (
                      "Sob consulta"
                    ) : (
                      <>
                        R$ {price}
                        <span className="text-xs font-normal text-muted-foreground">/mês</span>
                      </>
                    )}
                  </p>
                  <ul className="mt-5 flex-1 space-y-2.5">
                    {p.items.map((it) => (
                      <li key={it} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                        {it}
                      </li>
                    ))}
                  </ul>
                  <Button variant={p.highlight ? "brand" : "subtle"} className="mt-6 w-full">
                    {price === null ? "Falar com vendas" : "Assinar"}
                  </Button>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const faqs = [
  {
    q: "Preciso de API Oficial da Meta?",
    a: "Não. Você pode conectar por QR Code em segundos ou usar a API Oficial da Meta — cada empresa escolhe o modo e pode manter vários números ativos ao mesmo tempo.",
  },
  {
    q: "Como funciona o isolamento entre empresas?",
    a: "Toda informação é vinculada a um company_id e protegida por políticas de acesso no banco. Nenhum usuário enxerga dados de outra empresa.",
  },
  {
    q: "Posso trocar de plano depois?",
    a: "Sim. Upgrade, downgrade e cancelamento são imediatos, com cobrança proporcional e renovação automática.",
  },
  {
    q: "Existe teste gratuito?",
    a: "Sim, o plano Free é permanente e todos os planos pagos têm período de teste sem cartão de crédito.",
  },
  {
    q: "Quais pagamentos são suportados?",
    a: "PIX, boleto e cartão, com integrações preparadas para Stripe, Mercado Pago e Asaas.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="relative py-24">
      <div className="mx-auto max-w-3xl px-5">
        <Reveal className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Perguntas frequentes</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <Accordion type="single" collapsible className="mt-10 rounded-2xl glass px-5">
            {faqs.map((f) => (
              <AccordionItem key={f.q} value={f.q}>
                <AccordionTrigger className="text-left text-sm">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
