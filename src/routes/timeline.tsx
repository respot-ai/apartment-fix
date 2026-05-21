import { createFileRoute, Link } from "@tanstack/react-router";
import { defects } from "@/data/mock";
import { daysUntil, formatDate } from "@/lib/format";
import { ScreenHeader } from "@/components/ScreenHeader";

export const Route = createFileRoute("/timeline")({
  head: () => ({
    meta: [
      { title: "Timeline — Handover Tracker" },
      { name: "description", content: "Scheduled fixes, supplier appointments, and overdue items in a shared timeline." },
    ],
  }),
  component: Timeline,
});

function Timeline() {
  const open = defects.filter((d) => d.status !== "verified");
  const overdue = open.filter((d) => daysUntil(d.dueDate) < 0);
  const today = open.filter((d) => daysUntil(d.dueDate) === 0);
  const thisWeek = open.filter((d) => {
    const n = daysUntil(d.dueDate);
    return n > 0 && n <= 7;
  });
  const later = open.filter((d) => daysUntil(d.dueDate) > 7);
  const completed = defects.filter((d) => d.status === "fixed" || d.status === "verified");

  return (
    <div>
      <ScreenHeader title="Timeline" subtitle="Scheduled & overdue" />
      <div className="px-5 pb-6 space-y-6">
        <Section title="Overdue" items={overdue} tone="red" />
        <Section title="Today" items={today} tone="amber" />
        <Section title="This week" items={thisWeek} />
        <Section title="Later" items={later} />
        <Section title="Recently completed" items={completed} tone="emerald" />
      </div>
    </div>
  );
}

function Section({
  title,
  items,
  tone = "neutral",
}: {
  title: string;
  items: typeof defects;
  tone?: "red" | "amber" | "emerald" | "neutral";
}) {
  if (items.length === 0) return null;
  const dot =
    tone === "red"
      ? "bg-red-500"
      : tone === "amber"
        ? "bg-amber-500"
        : tone === "emerald"
          ? "bg-emerald-500"
          : "bg-zinc-300";

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span className={`size-2 rounded-full ${dot}`} />
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </h2>
        <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
          {items.length}
        </span>
      </div>
      <div className="space-y-2">
        {items.map((d) => (
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
                {d.room} · {d.trade}
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {formatDate(d.dueDate)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
