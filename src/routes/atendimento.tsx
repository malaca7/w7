import { createFileRoute } from "@tanstack/react-router";
import { WhatsAppWorkspace } from "@/modules/whatsapp/components/whatsapp-workspace";

const title = "W7 Atendimento — WhatsApp Multi-Tenant";
const description =
  "Módulo completo de conexões WhatsApp, inbox em tempo real, CRM integrado, automações e dashboard para operação multiempresa.";

export const Route = createFileRoute("/atendimento")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
  }),
  component: AtendimentoPage,
});

function AtendimentoPage() {
  return <WhatsAppWorkspace />;
}
