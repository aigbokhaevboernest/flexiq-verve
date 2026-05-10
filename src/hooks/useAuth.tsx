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
      const { data } = await supabase
        .from("profiles")
        .select("status, frozen")
        .eq("id", userId)
        .maybeSingle();
      if (data) {
        setProfile(data);
        if (data.status === "blocked") {
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setProfile(null);
          alert("Your account has been blocked. Please contact support.");
        }
      }
    } catch {
      // silently fail — don't block loading
    }
  };

  useEffect(() => {
    // Safety timeout — force loading to false after 5 seconds no matter what
    const timeout = setTimeout(() => setLoading(false), 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await Promise.race([
          checkStatus(newSession.user.id),
          new Promise<void>(resolve => setTimeout(resolve, 4000)),
        ]);
      }
      clearTimeout(timeout);
      setLoading(false);
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
