import { Menu, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/useAuth";
import { useUiStore } from "@/store/uiStore";
import { de } from "@/i18n/de";

export function Header() {
  const { account, logout, isAdmin } = useAuth();
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);

  function handleLogout() {
    void logout();
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 shadow-sm">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1">
        <span className="text-lg font-semibold tracking-tight">
          Access Package Portal
        </span>
      </div>

      <div className="flex items-center gap-2">
        {isAdmin && (
          <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
            Admin
          </span>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{account?.name ?? account?.username}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          aria-label={de.auth.signOut}
        >
          <LogOut className="h-4 w-4" />
          <span className="sr-only">{de.auth.signOut}</span>
        </Button>
      </div>
    </header>
  );
}
