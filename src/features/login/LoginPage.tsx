import { Button } from "@/components/ui/button";
import { de } from "@/i18n/de";
import { useAuth } from "@/auth/useAuth";
import { useState } from "react";

export function LoginPage() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setIsLoading(true);
    setError(null);
    try {
      await login();
    } catch {
      setError(de.errors.generic);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-8 shadow-md">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            {de.auth.welcomeTitle}
          </h1>
          <p className="text-sm text-muted-foreground">
            {de.auth.welcomeDescription}
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <Button
          className="w-full"
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? de.auth.signingIn : de.auth.signIn}
        </Button>
      </div>
    </div>
  );
}
