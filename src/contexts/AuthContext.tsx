import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface DealerInfo {
  id: string;
  business_name: string;
  status: string;
  approved_at: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isDealer: boolean;
  isApprovedDealer: boolean;
  dealerInfo: DealerInfo | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshDealerStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dealerInfo, setDealerInfo] = useState<DealerInfo | null>(null);

  const fetchDealerInfo = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("dealers")
        .select("id, business_name, status, approved_at")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching dealer info:", error);
        setDealerInfo(null);
        return;
      }

      setDealerInfo(data);
    } catch (err) {
      console.error("Error in fetchDealerInfo:", err);
      setDealerInfo(null);
    }
  }, []);

  const refreshDealerStatus = useCallback(async () => {
    if (user?.id) {
      await fetchDealerInfo(user.id);
    }
  }, [user?.id, fetchDealerInfo]);

  useEffect(() => {
    let dealerSubscription: ReturnType<typeof supabase.channel> | null = null;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        // Clean up previous subscription if any
        if (dealerSubscription) {
          supabase.removeChannel(dealerSubscription);
          dealerSubscription = null;
        }

        // Defer dealer info fetch with setTimeout
        if (session?.user) {
          setTimeout(() => {
            fetchDealerInfo(session.user.id);
          }, 0);

          // Listen for dealer status changes in real-time
          dealerSubscription = supabase
            .channel(`dealer_updates_${session.user.id}`)
            .on(
              'postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'dealers',
                filter: `user_id=eq.${session.user.id}`
              },
              () => {
                fetchDealerInfo(session.user.id);
              }
            )
            .subscribe();
        } else {
          setDealerInfo(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      if (session?.user) {
        fetchDealerInfo(session.user.id);
        
        // Also subscribe here for the initial load if there's a user
        dealerSubscription = supabase
          .channel(`dealer_updates_init_${session.user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'dealers',
              filter: `user_id=eq.${session.user.id}`
            },
            () => {
              fetchDealerInfo(session.user.id);
            }
          )
          .subscribe();
      }
    });

    return () => {
      subscription.unsubscribe();
      if (dealerSubscription) {
        supabase.removeChannel(dealerSubscription);
      }
    };
  }, [fetchDealerInfo]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setDealerInfo(null);
  };

  const isDealer = !!dealerInfo;
  const isApprovedDealer = dealerInfo?.status === "approved";

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isDealer,
        isApprovedDealer,
        dealerInfo,
        signIn,
        signUp,
        signOut,
        refreshDealerStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
