import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { Features, Integrations, HowItWorks } from "@/components/landing/Sections";
import { DashboardShowcase, Testimonials, Pricing, FAQ } from "@/components/landing/Showcase";
import { CTA, Footer } from "@/components/landing/Footer";

const title = "W7 — Atendimento inteligente via WhatsApp para empresas";
const description =
  "CRM, chatbot visual, campanhas, financeiro e assinaturas em uma plataforma multi-empresa para atendimento via WhatsApp.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-dvh bg-background">
      <Nav />
      <main>
        
        <Hero />
        <Features />
        <DashboardShowcase />
        <Integrations />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
