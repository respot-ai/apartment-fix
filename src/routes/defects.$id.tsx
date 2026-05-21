import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { defects, suppliers } from "@/data/mock";
import { ScreenHeader } from "@/components/ScreenHeader";
import { OwnerChip, PriorityChip } from "@/components/Chips";
import {
  agreementLabel,
  formatDate,
  statusLabel,
} from "@/lib/format";
import { CheckCircle2, RotateCcw, Phone, Lock, Clock } from "lucide-react";

export const Route = createFileRoute("/defects/$id")({
  loader: ({ params }) => {
    const defect = defects.find((d) => d.id === params.id);
    if (!defect) throw notFound();
    return { defect };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.defect.title ?? "Defect"} — Handover Tracker` },
      { name: "description", content: loaderData?.defect.description ?? "Defect detail" },
    ],
  }),
  component: DefectDetail,
  notFoundComponent: () => (
    <div className="p-10 text-center">
      <p className="text-sm text-muted-foreground">Defect not found.</p>
      <Link to="/defects" className="text-sm font-medium underline mt-2 inline-block">
        Back to defects
      </Link>
    </div>
  ),
});

function DefectDetail() {
  const { defect } = Route.useLoaderData();
  const supplier = defect.supplierId
    ? suppliers.find((s) => s.id === defect.supplierId)
    : undefined;

  const agreementTone =
    defect.agreement === "locked"
      ? "bg-emerald-50 ring-emerald-600/10 text-emerald-900"
      : defect.agreement === "disputed"
        ? "bg-red-50 ring-red-600/10 text-red-900"
        : "bg-amber-50 ring-amber-600/10 text-amber-900";

  const AgreementIcon =
    defect.agreement === "locked"
      ? Lock
      : defect.agreement === "disputed"
        ? RotateCcw
        : Clock;

  return (
    <div className="pb-4">
      <ScreenHeader
        back="/defects"
        title={`Item #${defect.id.replace("d-", "")}`}
        subtitle={`${defect.room} · ${defect.trade}`}
      />

      <div className="px-5 space-y-5">
        {/* Photo pair */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
              Before
            </p>
            <div
              className="aspect-square rounded-xl ring-1 ring-black/5"
              style={{ backgroundImage: defect.photoBefore }}
            />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
              After
            </p>
            <div
              className={`aspect-square rounded-xl ring-1 ring-black/5 grid place-items-center ${
                defect.photoAfter ? "" : "bg-secondary"
              }`}
              style={
                defect.photoAfter ? { backgroundImage: defect.photoAfter } : {}
              }
            >
              {!defect.photoAfter && (
                <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  Pending
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Title + priority */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <PriorityChip priority={defect.priority} />
            <OwnerChip owner={defect.owner} />
            <span className="text-[10px] font-medium px-1.5 py-0.5 bg-secondary text-muted-foreground rounded ring-1 ring-black/5">
              {statusLabel[defect.status]}
            </span>
          </div>
          <h2 className="text-lg font-semibold text-balance">{defect.title}</h2>
        </div>

        {/* Agreement banner */}
        <div
          className={`p-4 rounded-xl ring-1 flex items-start gap-3 ${agreementTone}`}
        >
          <AgreementIcon className="size-4 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">{agreementLabel[defect.agreement]}</p>
            <p className="text-xs opacity-80 mt-0.5">
              {defect.agreement === "locked"
                ? `${supplier ? supplier.name : "Contractor"} committed to fix by ${formatDate(defect.dueDate)}.`
                : defect.agreement === "waiting-homeowner"
                  ? `Review the proposal — confirm or dispute.`
                  : defect.agreement === "disputed"
                    ? `Open dispute — needs resolution.`
                    : `Contractor still needs to commit a date.`}
            </p>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-y-5 pt-2 border-t border-black/5">
          <Field label="Room" value={defect.room} />
          <Field label="Trade" value={defect.trade} />
          <Field label="Exact location" value={defect.location} />
          <Field label="Due date" value={formatDate(defect.dueDate)} />
          <Field label="Reported" value={formatDate(defect.reportedAt)} />
          <Field label="Protocol ref" value={defect.protocolRef} />
          <div className="col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Description
            </p>
            <p className="text-sm leading-relaxed text-foreground/80 text-pretty">
              {defect.description}
            </p>
          </div>
        </div>

        {/* Supplier */}
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
              <p className="text-xs text-muted-foreground truncate">
                {supplier.domain}
              </p>
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

        {/* Comments */}
        {defect.comments.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Comments
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

        {/* Activity */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Activity
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

      {/* Sticky actions */}
      <div className="sticky bottom-20 mt-6 mx-5 grid grid-cols-2 gap-2 bg-surface pt-2">
        <button className="py-3 px-3 bg-card ring-1 ring-black/5 text-foreground rounded-xl text-sm font-medium flex items-center justify-center gap-1.5">
          <RotateCcw className="size-4" />
          Request rework
        </button>
        <button className="py-3 px-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium flex items-center justify-center gap-1.5">
          <CheckCircle2 className="size-4" />
          Accept fix
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
