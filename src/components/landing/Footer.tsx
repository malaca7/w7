import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Reveal } from "./Reveal";
import { W7Logo } from "./W7Logo";

export function CTA() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-5xl px-5">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl glass px-6 py-16 text-center">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 left-1/2 size-96 -translate-x-1/2 rounded-full blur-[120px] animate-aurora"
              style={{
                background: "radial-gradient(circle, oklch(0.9 0.24 128 / 30%), transparent 70%)",
              }}
            />
            <div className="relative">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Comece a atender melhor <span className="text-gradient">hoje</span>
              </h2>
              <p className="mx-auto mt-4 max-w-md text-muted-foreground">
                Crie sua empresa na <span className="font-bold text-gradient">W7</span> em menos de dois minutos. Sem cartão, sem instalação.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button variant="brand" size="xl" asChild>
                  <Link to="/auth/register">
                    Criar conta grátis
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button variant="subtle" size="xl">
                  Falar com especialista
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const columns = [
  { title: "Produto", links: ["Recursos", "Integrações", "Planos", "Novidades"] },
  { title: "Empresa", links: ["Sobre", "Blog", "Carreiras", "Contato"] },
  { title: "Suporte", links: ["Central de ajuda", "Documentação", "Status", "API"] },
  { title: "Legal", links: ["Privacidade", "Termos", "LGPD", "Segurança"] },
];

export function Footer() {
  return (
    <footer className="border-t border-border py-14">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div>
            <Link to="/" className="w-fit" aria-label="Ir para a página inicial">
              <W7Logo showTagline />
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Plataforma SaaS <span className="font-bold text-gradient">W7</span> de atendimento inteligente via WhatsApp para empresas que crescem.
            </p>
          </div>
          {columns.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                {c.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#recursos"
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <p className="mt-12 text-xs text-muted-foreground">
          © {new Date().getFullYear()} <span className="font-bold text-gradient">W7</span>. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
