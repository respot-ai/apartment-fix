import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDefects, useRooms } from "@/lib/api";
import { sortDefects, shortDate, daysUntil, statusLabel } from "@/lib/format";
import { PriorityChip, OwnerChip } from "@/components/Chips";
import { Plus, Filter, Settings, X } from "lucide-react";

const SCROLL_KEY = "defects-list-scroll";

function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const style = getComputedStyle(node);
    if (/(auto|scroll|overlay)/.test(style.overflowY)) return node;
    node = node.parentElement;
  }
  return null;
}

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
  const [query, setQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const { data: defects = [], isLoading } = useDefects();
  const { data: rooms = [] } = useRooms();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollParentRef = useRef<HTMLElement | null>(null);
  const restoredRef = useRef(false);

  useEffect(() => {
    const parent = findScrollParent(sentinelRef.current);
    if (!parent) return;
    scrollParentRef.current = parent;
    const onScroll = () => {
      try {
        sessionStorage.setItem(SCROLL_KEY, String(parent.scrollTop));
      } catch {}
    };
    parent.addEventListener("scroll", onScroll, { passive: true });
    return () => parent.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (restoredRef.current) return;
    const parent = scrollParentRef.current;
    if (!parent || isLoading || defects.length === 0) return;
    const saved = Number(sessionStorage.getItem(SCROLL_KEY) || 0);
    if (saved > 0) parent.scrollTop = saved;
    restoredRef.current = true;
  }, [isLoading, defects.length]);

  const roomsWithDefects = useMemo(() => {
    const used = new Set(defects.map((d) => d.room));
    return rooms.filter((r) => used.has(r.name));
  }, [defects, rooms]);

  const searchIndex = useMemo(
    () =>
      defects.map((d) => ({
        id: d.id,
        haystack: `${d.shortId ?? ""} ${d.title} ${d.description}`.toLowerCase(),
      })),
    [defects],
  );

  const trimmedQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    const matchIds = trimmedQuery
      ? new Set(searchIndex.filter((e) => e.haystack.includes(trimmedQuery)).map((e) => e.id))
      : null;
    return sortDefects(
      defects.filter((d) => {
        if (room && d.room !== room) return false;
        if (matchIds && !matchIds.has(d.id)) return false;
        return true;
      }),
    );
  }, [defects, room, trimmedQuery, searchIndex]);
  const hasActiveFilter = !!room || !!trimmedQuery;

  return (
    <div>
      <div ref={sentinelRef} className="hidden" aria-hidden />
      <header className="px-5 pt-10 pb-3 bg-surface sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">פגמים</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filtered.length} פתוחים · ממוין לפי עדיפות
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/settings"
              className="size-10 grid place-items-center rounded-full ring-1 ring-black/5 bg-card"
              aria-label="הגדרות"
            >
              <Settings className="size-4" />
            </Link>
            <button
              onClick={() => setShowFilter((s) => !s)}
              className={`size-10 grid place-items-center rounded-full ring-1 ring-black/5 ${
                hasActiveFilter ? "bg-foreground text-background" : "bg-card"
              }`}
              aria-label="סינון"
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
          <div className="space-y-2 pb-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חיפוש לפי מזהה, כותרת או תיאור"
              className="w-full bg-card ring-1 ring-black/5 rounded-full px-3.5 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-foreground/30"
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setRoom(null)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                  !room
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground ring-1 ring-black/5"
                }`}
              >
                כל האזורים
              </button>
              {roomsWithDefects.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRoom(r.name === room ? null : r.name)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                    room === r.name
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground ring-1 ring-black/5"
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {hasActiveFilter && !showFilter && (
          <div className="flex flex-wrap gap-1.5">
            {room && (
              <button
                onClick={() => setRoom(null)}
                className="flex items-center gap-1 text-xs font-medium text-foreground bg-card ring-1 ring-black/5 rounded-full px-2.5 py-1"
              >
                <span>אזור: {room}</span>
                <X className="size-3" />
              </button>
            )}
            {trimmedQuery && (
              <button
                onClick={() => setQuery("")}
                className="flex items-center gap-1 text-xs font-medium text-foreground bg-card ring-1 ring-black/5 rounded-full px-2.5 py-1"
              >
                <span>חיפוש: {query.trim()}</span>
                <X className="size-3" />
              </button>
            )}
          </div>
        )}
      </header>

      <div className="px-5 py-4 space-y-3">
        {isLoading && filtered.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-10">טוען…</div>
        )}
        {!isLoading && filtered.length === 0 && (
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
                  {statusLabel[d.status]}
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
