import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Payload = {
  email: string;
  password: string;
  fullName: string;
  companyName: string;
};

function badRequest(message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as Partial<Payload>;
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const fullName = body.fullName?.trim();
    const companyName = body.companyName?.trim();

    if (!email || !password || !fullName || !companyName) {
      return badRequest("Campos obrigatórios ausentes");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const appUrl = Deno.env.get("APP_URL") ?? "https://w7.7all.com.br";

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Configuração do Supabase ausente" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: {
        redirectTo: `${appUrl}/auth/login`,
        data: { full_name: fullName, company_name: companyName },
      },
    });

    if (linkError || !linkData?.properties?.email_otp) {
      return new Response(JSON.stringify({ error: linkError?.message ?? "Falha ao gerar OTP" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const otp = linkData.properties.email_otp;

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const mailFrom = Deno.env.get("MAIL_FROM") ?? "W7 <noreply@7all.com.br>";
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
        <h2>Confirme seu cadastro na W7</h2>
        <p>Olá ${fullName},</p>
        <p>Seu código de ativação é:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:12px 0">${otp}</p>
        <p>Este código expira em breve. Se você não solicitou, ignore este e-mail.</p>
      </div>
    `;

    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: mailFrom,
        to: [email],
        subject: "W7 - Código de ativação",
        html,
      }),
    });

    if (!resendResp.ok) {
      const payload = await resendResp.text();
      return new Response(JSON.stringify({ error: `Falha no provedor SMTP: ${payload}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ message: "Código enviado com sucesso" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
