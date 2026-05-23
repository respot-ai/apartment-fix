import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ImageViewerDialog } from "@/components/ImageViewerDialog";
import { OwnerChip, PriorityChip } from "@/components/Chips";
import { formatDate, sortDefects, statusLabel } from "@/lib/format";
import {
  useAddComment,
  useDefect,
  useDefects,
  useDeleteComment,
  useSuppliers,
  useUpdateComment,
  useUpdateDefect,
} from "@/lib/api";
import { THIRD_PARTY_OWNER_ID, type Status } from "@/lib/types";
import { Check, ChevronLeft, ChevronRight, Copy, Pencil, Trash2, X } from "lucide-react";

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
  const { data: allDefects = [] } = useDefects();
  const updateDefect = useUpdateDefect(id);
  const addComment = useAddComment(id);
  const updateComment = useUpdateComment(id);
  const deleteComment = useDeleteComment(id);
  const { data: suppliers = [] } = useSuppliers();

  const { prev, next } = useMemo(() => {
    const sorted = sortDefects(allDefects);
    const idx = sorted.findIndex((d) => d.id === id);
    if (idx === -1) return { prev: null, next: null };
    return {
      prev: idx > 0 ? sorted[idx - 1] : null,
      next: idx < sorted.length - 1 ? sorted[idx + 1] : null,
    };
  }, [allDefects, id]);
  const [commentText, setCommentText] = useState("");
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

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

        <section className="grid grid-cols-2 gap-3">
          <div>
            <Label>עדיפות</Label>
            <div className="mt-1.5">
              <PriorityChip priority={defect.priority} />
            </div>
          </div>
          <div>
            <Label>אחראי</Label>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <OwnerChip owner={defect.owner} />
              {defect.owner === THIRD_PARTY_OWNER_ID &&
                defect.supplierId &&
                (() => {
                  const supplier = suppliers.find((s) => s.id === defect.supplierId);
                  if (!supplier) return null;
                  return (
                    <Link
                      to="/suppliers/$id"
                      params={{ id: supplier.id }}
                      className="text-sm font-medium underline"
                    >
                      {supplier.name}
                    </Link>
                  );
                })()}
            </div>
          </div>
        </section>

        <section>
          <Label>תיאור</Label>
          <p className="text-sm leading-relaxed text-foreground/80 text-pretty mt-1 whitespace-pre-wrap">
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
            {defect.comments.map((c) => {
              const isEditing = editingId === c.id;
              return (
                <div key={c.id} className="bg-card ring-1 ring-black/5 rounded-xl p-3">
                  {isEditing ? (
                    <>
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        rows={2}
                        className="w-full bg-background ring-1 ring-black/5 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-foreground/30 resize-none"
                      />
                      <div className="flex justify-end gap-1.5 mt-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="grid place-items-center size-7 rounded-full ring-1 ring-black/10 text-muted-foreground hover:text-foreground"
                          aria-label="בטל"
                        >
                          <X className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={!editingText.trim() || updateComment.isPending}
                          onClick={() => {
                            const text = editingText.trim();
                            if (!text) return;
                            updateComment.mutate(
                              { commentId: c.id, text },
                              { onSuccess: () => setEditingId(null) },
                            );
                          }}
                          className="grid place-items-center size-7 rounded-full bg-primary text-primary-foreground disabled:opacity-50"
                          aria-label="שמור"
                        >
                          <Check className="size-3.5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-foreground/80 flex-1 whitespace-pre-wrap">
                          {c.text}
                        </p>
                        <div className="flex gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(c.id);
                              setEditingText(c.text);
                            }}
                            className="grid place-items-center size-7 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                            aria-label="ערוך הערה"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={deleteComment.isPending}
                            onClick={() => deleteComment.mutate(c.id)}
                            className="grid place-items-center size-7 rounded-full text-muted-foreground hover:bg-secondary hover:text-red-700 disabled:opacity-50"
                            aria-label="מחק הערה"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1.5">{c.at}</p>
                    </>
                  )}
                </div>
              );
            })}
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

        <NavRow prev={prev?.id ?? null} next={next?.id ?? null} shortId={defect.shortId} />
      </div>
    </div>
  );
}

function NavRow({
  prev,
  next,
  shortId,
}: {
  prev: string | null;
  next: string | null;
  shortId?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="pt-4 flex items-center justify-center gap-3 text-muted-foreground">
      {prev ? (
        <Link
          to="/defects/$id"
          params={{ id: prev }}
          className="grid place-items-center size-9 rounded-full ring-1 ring-black/5 bg-card hover:text-foreground"
          aria-label="הקודם"
        >
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <div className="size-9" />
      )}

      {shortId && (
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-mono font-semibold text-foreground/80 tabular-nums">
            {shortId}
          </span>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(shortId);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
            className="grid place-items-center size-7 rounded-full hover:bg-secondary hover:text-foreground"
            aria-label="העתק מזהה"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </button>
        </div>
      )}

      {next ? (
        <Link
          to="/defects/$id"
          params={{ id: next }}
          className="grid place-items-center size-9 rounded-full ring-1 ring-black/5 bg-card hover:text-foreground"
          aria-label="הבא"
        >
          <ChevronLeft className="size-4" />
        </Link>
      ) : (
        <div className="size-9" />
      )}
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
