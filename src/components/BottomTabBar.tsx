import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ListChecks, Users, Calendar, FileText } from "lucide-react";

const tabs: { to: string; label: string; icon: typeof Home; exact?: boolean }[] = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/defects", label: "Defects", icon: ListChecks },
  { to: "/suppliers", label: "Suppliers", icon: Users },
  { to: "/timeline", label: "Timeline", icon: Calendar },
  { to: "/reports", label: "Reports", icon: FileText },
];

export function BottomTabBar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="absolute bottom-0 inset-x-0 h-20 bg-card/95 backdrop-blur border-t border-black/5 flex items-stretch justify-around px-2 pb-4 pt-2">
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = t.exact ? path === t.to : path.startsWith(t.to);
        return (
          <Link
            key={t.to}
            to={t.to}
            className="flex-1 flex flex-col items-center justify-center gap-1 group"
          >
            <Icon
              className={`size-5 transition-colors ${active ? "text-foreground" : "text-muted-foreground"}`}
              strokeWidth={active ? 2.25 : 1.75}
            />
            <span
              className={`text-[10px] font-medium tracking-wide ${active ? "text-foreground" : "text-muted-foreground"}`}
            >
              {t.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
