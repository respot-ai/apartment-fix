import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { defects, suppliers } from "@/data/mock";
import { ScreenHeader } from "@/components/ScreenHeader";
import { OwnerChip, PriorityChip } from "@/components/Chips";
import { formatDate, statusLabel } from "@/lib/format";
import { CheckCircle2, RotateCcw, Phone } from "lucide-react";

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

function DefectDetail() {
  const { defect } = Route.useLoaderData() as { defect: (typeof defects)[number] };
  const supplier = defect.supplierId
    ? suppliers.find((s) => s.id === defect.supplierId)
    : undefined;

  return (
    <div className="pb-4">
      <ScreenHeader
        back="/"
        title={`פריט #${defect.id.replace("d-", "")}`}
        subtitle={`${defect.room} · ${defect.trade}`}
      />

      <div className="px-5 space-y-5">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
              לפני
            </p>
            <div
              className="aspect-square rounded-xl ring-1 ring-black/5"
              style={{ backgroundImage: defect.photoBefore }}
            />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
              אחרי
            </p>
            <div
              className={`aspect-square rounded-xl ring-1 ring-black/5 grid place-items-center ${
                defect.photoAfter ? "" : "bg-secondary"
              }`}
              style={defect.photoAfter ? { backgroundImage: defect.photoAfter } : {}}
            >
              {!defect.photoAfter && (
                <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  ממתין
                </span>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <PriorityChip priority={defect.priority} />
            <OwnerChip owner={defect.owner} />
            <span className="text-[10px] font-medium px-1.5 py-0.5 bg-secondary text-muted-foreground rounded ring-1 ring-black/5">
              {statusLabel[defect.status]}
            </span>
          </div>
          <h2 className="text-lg font-semibold text-balance">{defect.title}</h2>
        </div>

        <div className="grid grid-cols-2 gap-y-5 pt-2 border-t border-black/5">
          <Field label="אזור" value={defect.room} />
          <Field label="תחום" value={defect.trade} />
          <Field label="מיקום מדויק" value={defect.location} />
          <Field label="תאריך יעד" value={formatDate(defect.dueDate)} />
          <Field label="דווח בתאריך" value={formatDate(defect.reportedAt)} />
          <Field label="אסמכתא בפרוטוקול" value={defect.protocolRef} />
          <div className="col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
              תיאור
            </p>
            <p className="text-sm leading-relaxed text-foreground/80 text-pretty">
              {defect.description}
            </p>
          </div>
        </div>

        {supplier && (
          <Link
            to="/suppliers/$id"
            params={{ id: supplier.id }}
            className="flex items-center gap-3 p-3 bg-card ring-1 ring-black/5 rounded-xl"
          >
            <div className="size-9 grid place-items-center bg-secondary rounded-lg text-[11px] font-semibold">
              {supplier.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{supplier.name}</p>
              <p className="text-xs text-muted-foreground truncate">{supplier.domain}</p>
            </div>
            <a
              href={`tel:${supplier.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="size-9 grid place-items-center bg-primary text-primary-foreground rounded-lg"
            >
              <Phone className="size-4" />
            </a>
          </Link>
        )}

        {defect.comments.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              הערות
            </p>
            <div className="space-y-2">
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
            </div>
          </div>
        )}

        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            היסטוריה
          </p>
          <div className="space-y-3">
            {defect.activity.map((a) => (
              <div key={a.id} className="flex gap-3">
                <div className="size-6 rounded-full bg-secondary ring-1 ring-black/5 grid place-items-center text-[10px] font-medium shrink-0">
                  {a.initials}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium">{a.text}</p>
                  <p className="text-[10px] text-muted-foreground">{a.at}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sticky bottom-20 mt-6 mx-5 grid grid-cols-2 gap-2 bg-surface pt-2">
        <button className="py-3 px-3 bg-card ring-1 ring-black/5 text-foreground rounded-xl text-sm font-medium flex items-center justify-center gap-1.5">
          <RotateCcw className="size-4" />
          דרוש תיקון מחדש
        </button>
        <button className="py-3 px-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium flex items-center justify-center gap-1.5">
          <CheckCircle2 className="size-4" />
          אישור תיקון
        </button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
        {label}
      </p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
