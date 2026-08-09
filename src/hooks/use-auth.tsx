import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { getSupabase } from "@/lib/supabase";
import { fetchAuthUser, signOut as authSignOut, type AuthUser } from "@/lib/auth";
import type { Session } from "@supabase/supabase-js";

interface AuthContextValue {
  authUser: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (sess: Session | null) => {
    if (!sess?.user) {
      setAuthUser(null);
      setSession(null);
      setLoading(false);
      return;
    }
    setSession(sess);
    const au = await fetchAuthUser();
    setAuthUser(au);
    setLoading(false);
  }, []);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }

    sb.auth.getSession().then(({ data }) => load(data.session));

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, sess) => {
      load(sess);
    });

    return () => subscription.unsubscribe();
  }, [load]);

  const signOut = useCallback(async () => {
    await authSignOut();
    setAuthUser(null);
    setSession(null);
  }, []);

  const refresh = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    const { data } = await sb.auth.getSession();
    await load(data.session);
  }, [load]);

  return (
    <AuthContext.Provider value={{ authUser, session, loading, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function useRequireAuth() {
  const ctx = useAuth();
  if (!ctx.authUser && !ctx.loading) {
    throw new Error("Not authenticated");
  }
  return ctx;
}
