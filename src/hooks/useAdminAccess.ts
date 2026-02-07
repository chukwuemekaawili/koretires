import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface AdminAccess {
  isAdmin: boolean;
  isStaff: boolean;
  isAdminOrStaff: boolean;
  isLoading: boolean;
  role: "admin" | "staff" | null;
}

export function useAdminAccess(): AdminAccess {
  const { user, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAccess = useCallback(async () => {
    if (!user?.id) {
      setIsAdmin(false);
      setIsStaff(false);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) throw error;

      const roles = data?.map((r) => r.role) || [];
      setIsAdmin(roles.includes("admin"));
      setIsStaff(roles.includes("staff"));
    } catch (err) {
      console.error("Error checking admin access:", err);
      setIsAdmin(false);
      setIsStaff(false);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading) {
      checkAccess();
    }
  }, [authLoading, checkAccess]);

  return {
    isAdmin,
    isStaff,
    isAdminOrStaff: isAdmin || isStaff,
    isLoading: authLoading || isLoading,
    role: isAdmin ? "admin" : isStaff ? "staff" : null,
  };
}
