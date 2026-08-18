import { getSupabase, requireSupabase, type Company, type Profile } from "./supabase";
import type { User } from "@supabase/supabase-js";

export interface RegistrationPayload {
  email: string;
  password: string;
  fullName: string;
  companyName: string;
}

export interface AuthUser {
  user: User;
  profile: Profile;
  company: Company;
}

export async function signInWithEmail(email: string, password: string) {
  const sb = requireSupabase();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function verifyEmailOtp(email: string, token: string) {
  const sb = requireSupabase();
  const { data, error } = await sb.auth.verifyOtp({ email, token, type: "signup" });
  if (error) throw error;
  return data;
}

export async function resendSignupOtp(email: string) {
  const sb = requireSupabase();
  const { data, error } = await sb.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/login`,
    },
  });
  if (error) throw error;
  return data;
}

export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const sb = getSupabase();
    if (!sb) return false;
    const { data } = await sb.from("profiles").select("id").eq("email", email).maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

async function callDirectSignup(payload: RegistrationPayload) {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Supabase não configurado no .env");
  }

  const response = await fetch(`${url}/functions/v1/direct-signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json().catch(() => null)) as { error?: string; user?: any } | null;
  if (!response.ok) {
    throw new Error(body?.error ?? "Erro ao realizar cadastro via Edge Function");
  }

  return body;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string,
  companyName: string,
) {
  const sb = requireSupabase();

  try {
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, company_name: companyName },
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("disabled") || msg.includes("email signups are disabled")) {
        try {
          await callDirectSignup({ email, password, fullName, companyName });
          const signInRes = await sb.auth.signInWithPassword({ email, password });
          if (signInRes.data?.session) return signInRes.data;
        } catch {
          // If edge function is not deployed or fails
          throw new Error(
            "O cadastro por e-mail está desativado no Supabase. Para permitir cadastros, vá ao Supabase Dashboard > Authentication > Providers > Email e ative 'Allow new users to sign up'."
          );
        }
      }
      throw error;
    }

    if (!data.session) {
      const signInRes = await sb.auth.signInWithPassword({ email, password });
      if (signInRes.data?.session) return signInRes.data;
      return data;
    }

    return data;
  } catch (err: any) {
    const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
    if (msg.includes("disabled") || msg.includes("email signups are disabled") || msg.includes("failed to fetch")) {
      throw new Error(
        "O cadastro por e-mail está desativado no seu Supabase. Para habilitar, acesse o Supabase Dashboard em Authentication > Providers > Email e ative 'Allow new users to sign up'."
      );
    }
    throw err;
  }
}

async function callActivationCodeApi(payload: RegistrationPayload) {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env");
  }

  const response = await fetch(`${url}/functions/v1/send-activation-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
  if (!response.ok) {
    throw new Error(body?.error ?? "Erro ao enviar código de ativação");
  }

  return body;
}

export async function registerWithActivationCode(payload: RegistrationPayload) {
  return callActivationCodeApi(payload);
}

export async function resendActivationCode(payload: RegistrationPayload) {
  return callActivationCodeApi(payload);
}

export async function signOut() {
  const sb = requireSupabase();
  const { error } = await sb.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string) {
  const sb = requireSupabase();
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const sb = requireSupabase();
  const { error } = await sb.auth.updateUser({ password });
  if (error) throw error;
}

export async function getSession() {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session;
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.from("profiles").select("*").eq("id", userId).single();
  return data;
}

export async function fetchCompany(companyId: string): Promise<Company | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.from("companies").select("*").eq("id", companyId).single();
  return data;
}

export async function fetchAuthUser(): Promise<AuthUser | null> {
  const session = await getSession();
  if (!session?.user) return null;

  const profile = await fetchProfile(session.user.id);
  if (!profile) return null;

  const company = await fetchCompany(profile.company_id);
  if (!company) return null;

  return { user: session.user, profile, company };
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const sb = requireSupabase();
  const { data, error } = await sb.from("profiles").update(updates).eq("id", userId).select().single();
  if (error) throw error;
  return data as Profile;
}

export async function updateCompany(companyId: string, updates: Partial<Company>) {
  const sb = requireSupabase();
  const { data, error } = await sb.from("companies").update(updates).eq("id", companyId).select().single();
  if (error) throw error;
  return data as Company;
}
