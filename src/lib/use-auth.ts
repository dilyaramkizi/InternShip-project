import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Role = "student" | "company";
export type Profile = Tables<"profiles"> & { role: Role };

type AuthState = { loading: boolean; session: Session | null; profile: Profile | null };

/** Current session plus the profile row the signup trigger created. Browser-only; SSR reports loading. */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ loading: true, session: null, profile: null });
  useEffect(() => {
    let active = true;
    async function load(session: Session | null) {
      if (!session) {
        if (active) setState({ loading: false, session: null, profile: null });
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();
      if (active) setState({ loading: false, session, profile: (data as Profile | null) ?? null });
    }
    void supabase.auth.getSession().then(({ data }) => load(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // Token refreshes keep the same user; skip the extra profile fetch.
      if (event === "TOKEN_REFRESHED") return;
      // Deferred: Supabase forbids awaiting its own calls inside this callback.
      setTimeout(() => void load(session), 0);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  return state;
}

export const dashboardPath = (role: Role) => (role === "company" ? "/company" : "/student");
export const isNarxozEmail = (email: string) => /@narxoz\.kz$/i.test(email.trim());
