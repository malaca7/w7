import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { W7Logo } from "./W7Logo";

const links = [
  { href: "#recursos", label: "Recursos" },
  { href: "#integracoes", label: "Integrações" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#planos", label: "Planos" },
  { href: "#faq", label: "FAQ" },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <nav
        aria-label="Principal"
        className="mx-auto mt-4 flex max-w-6xl items-center justify-between gap-6 rounded-2xl glass px-4 py-3 sm:px-5"
      >
        <Link to="/" className="flex items-center gap-2" aria-label="W7 início">
          <W7Logo />
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/auth/login">Entrar</Link>
          </Button>
          <Button variant="brand" size="sm" asChild>
            <Link to="/auth/register">Teste grátis</Link>
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          className="inline-flex size-10 items-center justify-center rounded-xl border border-border md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {open && (
        <div className="mx-auto mt-2 max-w-6xl rounded-2xl glass p-3 md:hidden">
          <ul className="grid gap-1">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid gap-2">
            <Button variant="outline" asChild onClick={() => setOpen(false)}>
              <Link to="/auth/login">Entrar</Link>
            </Button>
            <Button variant="brand" asChild onClick={() => setOpen(false)}>
              <Link to="/auth/register">Teste grátis</Link>
            </Button>
          </div>
        </div>
      )}
    </motion.header>
  );
}
