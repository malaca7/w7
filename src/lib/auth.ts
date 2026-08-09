import { getSupabase, requireSupabase, type Company, type Profile } from "./supabase";
import type { User } from "@supabase/supabase-js";

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

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string,
  companyName: string,
) {
  const sb = requireSupabase();
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, company_name: companyName },
      emailRedirectTo: `${window.location.origin}/auth/login`,
    },
  });
  if (error) throw error;
  return data;
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
