import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { defects, rooms } from "@/data/mock";
import { sortDefects, shortDate, daysUntil, statusLabel } from "@/lib/format";
import { PriorityChip, OwnerChip } from "@/components/Chips";
import { Plus, Filter, X } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "פגמים — מעקב מסירת דירה" },
      { name: "description", content: "רשימת כל הפגמים בדירה לפי עדיפות ואזור." },
    ],
  }),
  component: DefectsList,
});

function DefectsList() {
  const [room, setRoom] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);

  const filtered = sortDefects(defects.filter((d) => (room ? d.room === room : true)));

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

      <div className="px-5 py-4 space-y-3">
        {filtered.length === 0 && (
          <div className="text-center bg-card/50 ring-1 ring-dashed ring-black/10 rounded-xl py-10">
            <p className="text-sm text-muted-foreground">אין פגמים</p>
            <Link
              to="/defects/new"
              className="inline-block mt-3 text-sm font-medium text-primary"
            >
              + הוסף פגם חדש
            </Link>
          </div>
        )}
        {filtered.map((d) => {
          const days = daysUntil(d.dueDate);
          const overdue = days < 0 && d.status !== "fixed";
          return (
            <Link
              key={d.id}
              to="/defects/$id"
              params={{ id: d.id }}
              className="block bg-card ring-1 ring-black/5 p-4 rounded-2xl active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <PriorityChip priority={d.priority} />
                <span className="text-[10px] font-medium text-muted-foreground">
                  {d.room}
                </span>
                <span className="text-[10px] font-medium text-muted-foreground mr-auto">
                  {statusLabel(d.status)}
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
}
