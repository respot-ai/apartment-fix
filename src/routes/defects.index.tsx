import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { defects } from "@/data/mock";
import { sortDefects } from "@/lib/format";
import { DefectCard } from "@/components/DefectCard";
import { Plus, SlidersHorizontal } from "lucide-react";

export const Route = createFileRoute("/defects/")({
  head: () => ({
    meta: [
      { title: "Defects — Handover Tracker" },
      { name: "description", content: "Prioritized list of every apartment handover defect with owner, status, and due date." },
    ],
  }),
  component: DefectList,
});

type Filter = "all" | "critical" | "needs-action" | "contractor" | "supplier";

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All items" },
  { id: "critical", label: "Critical" },
  { id: "needs-action", label: "Needs my action" },
  { id: "contractor", label: "Contractor" },
  { id: "supplier", label: "Supplier" },
];

function DefectList() {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = defects.filter((d) => {
    if (filter === "all") return true;
    if (filter === "critical") return d.priority === "critical";
    if (filter === "needs-action") return d.agreement === "waiting-homeowner";
    if (filter === "contractor") return d.owner === "contractor";
    if (filter === "supplier") return d.owner === "supplier";
    return true;
  });

  return (
    <div>
      <header className="px-5 pt-10 pb-4 bg-card border-b border-black/5 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Defects</h1>
            <p className="text-xs text-muted-foreground">
              {filtered.length} of {defects.length} items
            </p>
          </div>
          <div className="flex gap-2">
            <button className="size-9 grid place-items-center bg-secondary rounded-full ring-1 ring-black/5">
              <SlidersHorizontal className="size-4 text-muted-foreground" />
            </button>
            <Link
              to="/defects/new"
              className="size-9 grid place-items-center bg-primary text-primary-foreground rounded-full"
            >
              <Plus className="size-4" />
            </Link>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-1 scrollbar-none">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                filter === f.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground ring-1 ring-black/5"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-5 py-4 space-y-3">
        {sortDefects(filtered).map((d) => (
          <DefectCard key={d.id} defect={d} />
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-12">
            No defects match this filter.
          </p>
        )}
      </div>
    </div>
  );
}
