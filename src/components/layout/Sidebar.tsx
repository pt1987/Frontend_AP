import { NavLink } from "react-router-dom";
import { LayoutGrid, ShieldCheck, History, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/auth/useAuth";
import { useUiStore } from "@/store/uiStore";
import { de } from "@/i18n/de";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    to: "/catalog",
    label: de.nav.catalog,
    icon: LayoutGrid,
  },
  {
    to: "/my-access",
    label: de.nav.myAccess,
    icon: BookOpen,
  },
  {
    to: "/request-history",
    label: de.nav.requestHistory,
    icon: History,
  },
  {
    to: "/admin",
    label: de.nav.admin,
    icon: ShieldCheck,
    adminOnly: true,
  },
];

export function Sidebar() {
  const { isAdmin } = useAuth();
  const isCollapsed = useUiStore((state) => state.isSidebarCollapsed);

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-muted/40 transition-all duration-300",
        isCollapsed ? "w-16" : "w-56"
      )}
    >
      <nav className="flex flex-col gap-1 p-2 pt-4">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!isCollapsed && (
              <span className="truncate">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
