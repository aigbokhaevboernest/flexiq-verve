import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: { status: string; frozen: boolean } | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  profile: null,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ status: string; frozen: boolean } | null>(null);

  const checkStatus = async (userId: string) => {
    try {
      const { data } = await (supabase as any)
        .from("profiles")
        .select("frozen,status")
        .eq("id", userId)
        .maybeSingle();
      if (data) {
        setProfile({
          status: data.status || (data.frozen ? "frozen" : "active"),
          frozen: !!data.frozen,
        });
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 5000);

    // Initialise from existing session (avoids "Welcome back" flashing email
    // because we already know who the user is before the first render).
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) checkStatus(s.user.id);
      clearTimeout(timeout);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        // Fire and forget — never await inside onAuthStateChange
        checkStatus(newSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, profile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
