import { Navigate } from "react-router-dom";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { de } from "@/i18n/de";

interface AuthGuardProps {
  children: React.ReactNode;
}

// Redirects unauthenticated users to /login.
// Shows a loading state while MSAL initializes.
export function AuthGuard({ children }: AuthGuardProps) {
  const isAuthenticated = useIsAuthenticated();
  const { inProgress } = useMsal();
  const isInitializing = inProgress === InteractionStatus.Startup || inProgress === InteractionStatus.HandleRedirect;

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{de.common.loading}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
