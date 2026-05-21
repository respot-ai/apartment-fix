import { createFileRoute, Link } from "@tanstack/react-router";
import { defects, apartmentLabel, protocolSignedAt } from "@/data/mock";
import { sortDefects, shortDate, daysUntil } from "@/lib/format";
import { Plus, Upload, ChevronRight, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Handover Tracker" },
      { name: "description", content: "Overview of open apartment handover defects, critical items, and pending actions." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const open = defects.filter((d) => d.status !== "verified");
  const critical = open.filter((d) => d.priority === "critical");
  const waitingContractor = open.filter((d) => d.owner === "contractor");
  const waitingOwner = open.filter((d) => d.agreement === "waiting-homeowner");
  const waitingSupplier = open.filter((d) => d.owner === "supplier");
  const completedThisWeek = defects.filter((d) => d.status === "fixed" || d.status === "verified");
  const upcoming = sortDefects(open.filter((d) => daysUntil(d.dueDate) >= 0)).slice(0, 3);

  return (
    <div>
      <header className="px-5 pt-10 pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
          Apartment Handover
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          {apartmentLabel}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Protocol signed: {protocolSignedAt}
        </p>
      </header>

      <section className="px-5 grid grid-cols-2 gap-3">
        <Stat label="Open items" value={open.length} />
        <Stat
          label="Critical"
          value={critical.length}
          tone="critical"
        />
        <Stat label="Awaiting me" value={waitingOwner.length} />
        <Stat label="Completed" value={completedThisWeek.length} tone="success" />
      </section>

      <section className="px-5 mt-4 space-y-2">
        <Link
          to="/defects/new"
          className="w-full flex items-center justify-between px-3 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
        >
          <span className="flex items-center gap-2">
            <Plus className="size-4" />
            Add new defect
          </span>
          <ChevronRight className="size-4 opacity-70" />
        </Link>
        <button className="w-full flex items-center justify-between px-3 py-3 bg-card ring-1 ring-black/5 text-foreground rounded-xl text-sm font-medium">
          <span className="flex items-center gap-2">
            <Upload className="size-4 text-muted-foreground" />
            Import protocol PDF
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Soon
          </span>
        </button>
      </section>

      <section className="px-5 mt-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Responsibility
        </h2>
        <div className="space-y-1.5">
          <RespRow label="Contractor action" count={waitingContractor.length} to="/defects" />
          <RespRow label="Awaiting your confirmation" count={waitingOwner.length} to="/defects" />
          <RespRow label="Third-party supplier" count={waitingSupplier.length} to="/defects" />
        </div>
      </section>

      <section className="px-5 mt-6 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Next scheduled fixes
          </h2>
          <Link to="/timeline" className="text-xs font-medium text-muted-foreground">
            See all
          </Link>
        </div>
        <div className="space-y-2">
          {upcoming.map((d) => {
            const days = daysUntil(d.dueDate);
            const overdue = days < 0;
            return (
              <Link
                key={d.id}
                to="/defects/$id"
                params={{ id: d.id }}
                className="flex items-center gap-3 p-3 bg-card ring-1 ring-black/5 rounded-xl"
              >
                <div
                  className="size-10 rounded-lg ring-1 ring-black/5 shrink-0"
                  style={{ backgroundImage: d.photoBefore }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{d.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.room} · {shortDate(d.dueDate)}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded ring-1 ${
                    overdue
                      ? "bg-red-50 text-red-700 ring-red-200"
                      : days <= 2
                        ? "bg-amber-50 text-amber-700 ring-amber-200"
                        : "bg-zinc-100 text-zinc-600 ring-black/5"
                  }`}
                >
                  {overdue ? "Overdue" : days === 0 ? "Today" : `${days}d`}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "critical" | "success";
}) {
  const styles =
    tone === "critical"
      ? "bg-red-50 ring-red-900/5"
      : tone === "success"
        ? "bg-emerald-50 ring-emerald-900/5"
        : "bg-card ring-black/5";
  const num =
    tone === "critical"
      ? "text-red-700"
      : tone === "success"
        ? "text-emerald-700"
        : "text-foreground";
  return (
    <div className={`p-4 ring-1 rounded-2xl ${styles}`}>
      <span className={`flex items-baseline gap-1.5 text-2xl font-semibold mb-1 ${num}`}>
        {value}
        {tone === "critical" && value > 0 && (
          <AlertTriangle className="size-4 text-red-700/70" />
        )}
      </span>
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function RespRow({
  label,
  count,
  to,
}: {
  label: string;
  count: number;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between p-3 bg-card ring-1 ring-black/5 rounded-xl"
    >
      <span className="text-sm font-medium">{label}</span>
      <span className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground font-mono tabular-nums">
          {count.toString().padStart(2, "0")}
        </span>
        <ChevronRight className="size-4 text-muted-foreground" />
      </span>
    </Link>
  );
}
