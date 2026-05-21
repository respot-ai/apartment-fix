import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { defects } from "@/data/mock";
import { ScreenHeader } from "@/components/ScreenHeader";
import { statusLabel } from "@/lib/format";

export const Route = createFileRoute("/defects/$id")({
  loader: ({ params }) => {
    const defect = defects.find((d) => d.id === params.id);
    if (!defect) throw notFound();
    return { defect };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.defect.title ?? "פגם"} — מעקב מסירה` },
      { name: "description", content: loaderData?.defect.description ?? "פרטי פגם" },
    ],
  }),
  component: DefectDetail,
  notFoundComponent: () => (
    <div className="p-10 text-center">
      <p className="text-sm text-muted-foreground">הפגם לא נמצא.</p>
      <Link to="/" className="text-sm font-medium underline mt-2 inline-block">
        חזרה לרשימה
      </Link>
    </div>
  ),
});

const statusOptions: Array<{ id: keyof typeof statusLabel; label: string }> = [
  { id: "new", label: statusLabel["new"] },
  { id: "in-progress", label: statusLabel["in-progress"] },
  { id: "fixed", label: statusLabel["fixed"] },
];

function DefectDetail() {
  const { defect } = Route.useLoaderData() as { defect: (typeof defects)[number] };
  const images = [defect.photoBefore, defect.photoAfter].filter(Boolean) as string[];

  return (
    <div className="pb-10">
      <ScreenHeader back="/" title="פרטי פגם" subtitle={defect.room} />

      <div className="px-5 space-y-6">
        <section>
          <Label>נושא</Label>
          <h2 className="text-lg font-semibold text-balance mt-1">{defect.title}</h2>
        </section>

        <section>
          <Label>מיקום</Label>
          <p className="text-sm mt-1">
            {defect.room}
            {defect.location ? ` · ${defect.location}` : ""}
          </p>
        </section>

        <section>
          <Label>תיאור</Label>
          <p className="text-sm leading-relaxed text-foreground/80 text-pretty mt-1">
            {defect.description}
          </p>
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
              {images.map((img, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-xl ring-1 ring-black/5"
                  style={{ backgroundImage: img }}
                />
              ))}
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
            <textarea
              rows={2}
              placeholder="הוסף הערה…"
              className="w-full bg-card ring-1 ring-black/5 rounded-xl px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-foreground/30 resize-none"
            />
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
