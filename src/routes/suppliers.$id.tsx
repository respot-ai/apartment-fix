import { createFileRoute, Link } from "@tanstack/react-router";
import { useDefects, useSupplier } from "@/lib/api";
import { ScreenHeader } from "@/components/ScreenHeader";
import { PriorityChip, OwnerChip } from "@/components/Chips";
import { Phone, Mail, Globe } from "lucide-react";

export const Route = createFileRoute("/suppliers/$id")({
  head: () => ({
    meta: [
      { title: "ספק — מעקב מסירה" },
      { name: "description", content: "פרטי קשר ופגמים משויכים" },
    ],
  }),
  component: SupplierDetail,
});

function SupplierDetail() {
  const { id } = Route.useParams();
  const { data: supplier, isLoading, error } = useSupplier(id);
  const { data: defects = [] } = useDefects();

  if (isLoading) {
    return <div className="p-10 text-center text-sm text-muted-foreground">טוען…</div>;
  }

  if (error || !supplier) {
    return (
      <div className="p-10 text-center">
        <p className="text-sm text-muted-foreground">ספק לא נמצא.</p>
        <Link to="/suppliers" className="text-sm font-medium underline mt-2 inline-block">
          חזרה
        </Link>
      </div>
    );
  }

  const related = defects.filter((d) => d.supplierId === supplier.id);

  return (
    <div>
      <ScreenHeader back="/suppliers" title={supplier.name} subtitle={supplier.domain} />
      <div className="px-5 pb-6 space-y-5">
        <div className="grid grid-cols-3 gap-2">
          <a href={`tel:${supplier.phone}`} className="flex flex-col items-center gap-1 p-3 bg-card ring-1 ring-black/5 rounded-xl">
            <Phone className="size-4 text-muted-foreground" />
            <span className="text-[11px] font-medium">חיוג</span>
          </a>
          <a href={`mailto:${supplier.email}`} className="flex flex-col items-center gap-1 p-3 bg-card ring-1 ring-black/5 rounded-xl">
            <Mail className="size-4 text-muted-foreground" />
            <span className="text-[11px] font-medium">אימייל</span>
          </a>
          {supplier.website && (
            <a href={`https://${supplier.website}`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 p-3 bg-card ring-1 ring-black/5 rounded-xl">
              <Globe className="size-4 text-muted-foreground" />
              <span className="text-[11px] font-medium">אתר</span>
            </a>
          )}
        </div>

        <div className="bg-card ring-1 ring-black/5 rounded-xl divide-y divide-black/5">
          <Row label="טלפון" value={supplier.phone} />
          <Row label="אימייל" value={supplier.email} />
          {supplier.website && <Row label="אתר" value={supplier.website} />}
        </div>

        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            פגמים משויכים · {related.length}
          </h2>
          <div className="space-y-2">
            {related.map((d) => (
              <Link
                key={d.id}
                to="/defects/$id"
                params={{ id: d.id }}
                className="block bg-card ring-1 ring-black/5 p-3 rounded-2xl"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <PriorityChip priority={d.priority} />
                  <OwnerChip owner={d.owner} />
                  <span className="text-[10px] font-medium text-muted-foreground">{d.room}</span>
                </div>
                <p className="text-sm font-medium leading-snug line-clamp-2">{d.title}</p>
              </Link>
            ))}
            {related.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                אין פגמים משויכים.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
