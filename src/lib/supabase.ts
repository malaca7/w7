import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type UserRole = "owner" | "admin" | "supervisor" | "attendant";
export type PlanType = "trial" | "starter" | "pro" | "enterprise";

export interface Company {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  plan: PlanType;
  plan_status: string;
  trial_ends_at: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  company_id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  department_id: string | null;
  is_active: boolean;
  last_seen_at: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (_client) return _client;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  _client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: "w7-auth",
    },
  });

  return _client;
}

export function requireSupabase(): SupabaseClient {
  const client = getSupabase();
  if (!client) throw new Error("Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env");
  return client;
}
