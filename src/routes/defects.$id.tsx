import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ImageViewerDialog } from "@/components/ImageViewerDialog";
import { PriorityChip } from "@/components/Chips";
import { formatDate, statusLabel } from "@/lib/format";
import { useAddComment, useDefect, useUpdateDefect } from "@/lib/api";
import type { Status } from "@/lib/types";
import { Pencil } from "lucide-react";

export const Route = createFileRoute("/defects/$id")({
  head: () => ({
    meta: [{ title: "פגם — מעקב מסירה" }, { name: "description", content: "פרטי פגם" }],
  }),
  component: DefectDetail,
});

const statusOptions: Array<{ id: Status; label: string }> = [
  { id: "new", label: statusLabel["new"] },
  { id: "in-progress", label: statusLabel["in-progress"] },
  { id: "fixed", label: statusLabel["fixed"] },
];

function DefectDetail() {
  const { id } = Route.useParams();
  const { data: defect, isLoading, error } = useDefect(id);
  const updateDefect = useUpdateDefect(id);
  const addComment = useAddComment(id);
  const [commentText, setCommentText] = useState("");
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);

  if (isLoading) {
    return <div className="p-10 text-center text-sm text-muted-foreground">טוען…</div>;
  }

  if (error || !defect) {
    return (
      <div className="p-10 text-center">
        <p className="text-sm text-muted-foreground">הפגם לא נמצא.</p>
        <Link to="/" className="text-sm font-medium underline mt-2 inline-block">
          חזרה לרשימה
        </Link>
      </div>
    );
  }

  const images = [
    ...(defect.photos ?? []),
    ...([defect.photoBefore, defect.photoAfter].filter(Boolean) as string[]),
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  return (
    <div className="pb-10">
      <ImageViewerDialog
        src={viewerSrc}
        onClose={() => setViewerSrc(null)}
        initialRotation={(viewerSrc && defect.photoMeta?.[viewerSrc]?.rotation) || 0}
        onRotate={(rotation) => {
          if (!viewerSrc) return;
          const nextMeta = { ...(defect.photoMeta ?? {}) };
          if (rotation === 0) {
            delete nextMeta[viewerSrc];
          } else {
            nextMeta[viewerSrc] = { ...nextMeta[viewerSrc], rotation };
          }
          updateDefect.mutate({ photoMeta: nextMeta });
        }}
      />
      <ScreenHeader
        back="/"
        title="פרטי פגם"
        subtitle={defect.room}
        right={
          <Link
            to="/edit-defect/$id"
            params={{ id: defect.id }}
            className="size-9 grid place-items-center rounded-full ring-1 ring-black/5 bg-card text-foreground"
            aria-label="ערוך פגם"
          >
            <Pencil className="size-4" />
          </Link>
        }
      />

      <div className="px-5 space-y-6">
        <section>
          <Label>נושא</Label>
          <h2 className="text-lg font-semibold text-balance mt-1">{defect.title}</h2>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div>
            <Label>אזור</Label>
            <p className="text-sm mt-1">
              {defect.room}
              {defect.location ? ` · ${defect.location}` : ""}
            </p>
          </div>
          <div>
            <Label>תחום</Label>
            <p className="text-sm mt-1">{defect.trade || "—"}</p>
          </div>
        </section>

        <section>
          <Label>עדיפות</Label>
          <div className="mt-1.5">
            <PriorityChip priority={defect.priority} />
          </div>
        </section>

        <section>
          <Label>תיאור</Label>
          <p className="text-sm leading-relaxed text-foreground/80 text-pretty mt-1">
            {defect.description}
          </p>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div>
            <Label>דווח ב‑</Label>
            <p className="text-sm mt-1">{formatDate(defect.reportedAt)}</p>
          </div>
          <div>
            <Label>מקור</Label>
            <p className="text-sm mt-1">{defect.protocolRef || "—"}</p>
          </div>
        </section>

        <section>
          <Label>סטטוס</Label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {statusOptions.map((s) => {
              const active = s.id === defect.status;
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={updateDefect.isPending}
                  onClick={() => {
                    if (!active) updateDefect.mutate({ status: s.id });
                  }}
                  className={`py-2 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-card ring-1 ring-black/5 text-muted-foreground"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </section>

        {images.length > 0 && (
          <section>
            <Label>תמונות</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {images.map((img, i) => {
                const isUrl = /^https?:\/\//i.test(img);
                const rotation = defect.photoMeta?.[img]?.rotation ?? 0;
                return isUrl ? (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setViewerSrc(img)}
                    className="aspect-square rounded-xl ring-1 ring-black/5 overflow-hidden bg-secondary focus:outline-none focus:ring-2 focus:ring-foreground/30"
                    aria-label="הצג תמונה"
                  >
                    <img
                      src={img}
                      alt=""
                      className="size-full object-cover"
                      loading="lazy"
                      style={rotation ? { transform: `rotate(${rotation}deg)` } : undefined}
                    />
                  </button>
                ) : (
                  <div
                    key={i}
                    className="aspect-square rounded-xl ring-1 ring-black/5"
                    style={{ backgroundImage: img }}
                  />
                );
              })}
            </div>
          </section>
        )}

        <section>
          <Label>הערות</Label>
          <div className="space-y-2 mt-2">
            {defect.comments.length === 0 && (
              <p className="text-xs text-muted-foreground">אין הערות עדיין.</p>
            )}
            {defect.comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <div className="size-7 rounded-full bg-secondary ring-1 ring-black/5 grid place-items-center text-[10px] font-medium shrink-0">
                  {c.initials}
                </div>
                <div className="flex-1 bg-card ring-1 ring-black/5 rounded-xl p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-xs font-medium">{c.who}</p>
                    <p className="text-[10px] text-muted-foreground">{c.at}</p>
                  </div>
                  <p className="text-sm text-foreground/80 mt-1">{c.text}</p>
                </div>
              </div>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const text = commentText.trim();
                if (!text) return;
                addComment.mutate(
                  { who: "דייר", initials: "די", text },
                  { onSuccess: () => setCommentText("") },
                );
              }}
            >
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={2}
                placeholder="הוסף הערה…"
                className="w-full bg-card ring-1 ring-black/5 rounded-xl px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-foreground/30 resize-none"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || addComment.isPending}
                className="mt-2 py-2 px-4 bg-primary text-primary-foreground rounded-lg text-xs font-medium disabled:opacity-50"
              >
                {addComment.isPending ? "שולח…" : "הוסף הערה"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}
