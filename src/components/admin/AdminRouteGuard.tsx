import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { Loader2 } from "lucide-react";

interface AdminRouteGuardProps {
  children: ReactNode;
  requireAdmin?: boolean; // If true, requires admin role specifically; otherwise staff is enough
}

export function AdminRouteGuard({ children, requireAdmin = false }: AdminRouteGuardProps) {
  const { isAdmin, isAdminOrStaff, isLoading } = useAdminAccess();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  const hasAccess = requireAdmin ? isAdmin : isAdminOrStaff;

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
