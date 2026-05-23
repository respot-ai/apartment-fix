import { Link, useRouterState } from "@tanstack/react-router";
import { ListChecks, Users, FileText } from "lucide-react";

const tabs: { to: string; label: string; icon: typeof ListChecks; exact?: boolean }[] = [
  { to: "/", label: "פגמים", icon: ListChecks, exact: false },
  { to: "/suppliers", label: "ספקים", icon: Users },
  { to: "/reports", label: "דוחות", icon: FileText },
];

export function BottomTabBar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="absolute bottom-0 inset-x-0 h-14 bg-card/95 backdrop-blur border-t border-black/5 flex items-stretch justify-around px-2 py-2">
      {tabs.map((t) => {
        const Icon = t.icon;
        const active =
          t.to === "/"
            ? path === "/" || path.startsWith("/defects")
            : path.startsWith(t.to);
        return (
          <Link
            key={t.to}
            to={t.to}
            className="flex-1 flex flex-col items-center justify-center gap-1"
          >
            <Icon
              className={`size-5 transition-colors ${active ? "text-foreground" : "text-muted-foreground"}`}
              strokeWidth={active ? 2.25 : 1.75}
            />
            <span
              className={`text-[11px] font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}
            >
              {t.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
