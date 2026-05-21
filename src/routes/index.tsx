import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { defects, rooms, type Status } from "@/data/mock";
import { sortDefects, statusLabel, shortDate, daysUntil } from "@/lib/format";
import { PriorityChip, OwnerChip } from "@/components/Chips";
import { Plus, Filter, X } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "פגמים — מעקב מסירת דירה" },
      { name: "description", content: "לוח קנבן של כל הפגמים בדירה לפי סטטוס ועדיפות." },
    ],
  }),
  component: DefectsBoard,
});

const columns: { id: Status; label: string; tone: string }[] = [
  { id: "new", label: "חדש", tone: "bg-amber-500" },
  { id: "in-progress", label: "בטיפול", tone: "bg-blue-500" },
  { id: "fixed", label: "הושלם", tone: "bg-emerald-500" },
];

function DefectsBoard() {
  const [room, setRoom] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);

  const filtered = defects.filter((d) => (room ? d.room === room : true));

  return (
    <div>
      <header className="px-5 pt-10 pb-3 bg-surface sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">פגמים</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filtered.length} פתוחים · ממוין לפי עדיפות
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilter((s) => !s)}
              className={`size-10 grid place-items-center rounded-full ring-1 ring-black/5 ${
                room ? "bg-foreground text-background" : "bg-card"
              }`}
              aria-label="סינון לפי אזור"
            >
              <Filter className="size-4" />
            </button>
            <Link
              to="/defects/new"
              className="size-10 grid place-items-center bg-primary text-primary-foreground rounded-full"
              aria-label="הוסף פגם"
            >
              <Plus className="size-5" />
            </Link>
          </div>
        </div>

        {showFilter && (
          <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-2 scrollbar-none">
            <button
              onClick={() => setRoom(null)}
              className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-full ${
                !room
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground ring-1 ring-black/5"
              }`}
            >
              כל האזורים
            </button>
            {rooms.map((r) => (
              <button
                key={r}
                onClick={() => setRoom(r === room ? null : r)}
                className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-full ${
                  room === r
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground ring-1 ring-black/5"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        )}

        {room && !showFilter && (
          <button
            onClick={() => setRoom(null)}
            className="flex items-center gap-1 text-xs font-medium text-foreground bg-card ring-1 ring-black/5 rounded-full px-2.5 py-1 w-fit"
          >
            <span>אזור: {room}</span>
            <X className="size-3" />
          </button>
        )}
      </header>

      <div className="flex gap-3 overflow-x-auto px-5 py-4 scrollbar-none snap-x snap-mandatory">
        {columns.map((col) => {
          const items = sortDefects(filtered.filter((d) => d.status === col.id));
          return (
            <div
              key={col.id}
              className="shrink-0 w-[78%] snap-start space-y-2"
            >
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${col.tone}`} />
                  <h2 className="text-sm font-semibold">{col.label}</h2>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {items.length}
                </span>
              </div>
              <div className="space-y-2">
                {items.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center bg-card/50 ring-1 ring-dashed ring-black/10 rounded-xl py-6">
                    אין פריטים
                  </p>
                )}
                {items.map((d) => {
                  const days = daysUntil(d.dueDate);
                  const overdue = days < 0 && d.status !== "fixed";
                  return (
                    <Link
                      key={d.id}
                      to="/defects/$id"
                      params={{ id: d.id }}
                      className="block bg-card ring-1 ring-black/5 p-3 rounded-2xl active:scale-[0.99] transition-transform"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <PriorityChip priority={d.priority} />
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {d.room}
                        </span>
                      </div>
                      <h3 className="text-sm font-medium leading-snug text-pretty mb-2 line-clamp-2">
                        {d.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <OwnerChip owner={d.owner} />
                        <span
                          className={`text-[10px] font-medium ${
                            overdue
                              ? "text-red-700"
                              : days <= 2 && d.status !== "fixed"
                                ? "text-amber-700"
                                : "text-muted-foreground"
                          }`}
                        >
                          {d.status === "fixed"
                            ? "הושלם"
                            : overdue
                              ? "באיחור"
                              : shortDate(d.dueDate)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div className="shrink-0 w-2" aria-hidden />
      </div>
    </div>
  );
}

// Re-export statusLabel to silence unused import if needed
void statusLabel;
