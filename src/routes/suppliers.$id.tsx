import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { defects, suppliers } from "@/data/mock";
import { ScreenHeader } from "@/components/ScreenHeader";
import { DefectCard } from "@/components/DefectCard";
import { Phone, Mail, Globe, Plus } from "lucide-react";

export const Route = createFileRoute("/suppliers/$id")({
  loader: ({ params }) => {
    const supplier = suppliers.find((s) => s.id === params.id);
    if (!supplier) throw notFound();
    return { supplier };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.supplier.name ?? "Supplier"} — Handover Tracker` },
      { name: "description", content: `Contact ${loaderData?.supplier.name} and view related apartment defects.` },
    ],
  }),
  component: SupplierDetail,
  notFoundComponent: () => (
    <div className="p-10 text-center">
      <p className="text-sm text-muted-foreground">Supplier not found.</p>
      <Link to="/suppliers" className="text-sm font-medium underline mt-2 inline-block">
        Back
      </Link>
    </div>
  ),
});

function SupplierDetail() {
  const { supplier } = Route.useLoaderData();
  const related = defects.filter((d) => d.supplierId === supplier.id);

  return (
    <div>
      <ScreenHeader back="/suppliers" title={supplier.name} subtitle={supplier.domain} />
      <div className="px-5 pb-6 space-y-5">
        <div className="grid grid-cols-3 gap-2">
          <a
            href={`tel:${supplier.phone}`}
            className="flex flex-col items-center gap-1 p-3 bg-card ring-1 ring-black/5 rounded-xl"
          >
            <Phone className="size-4 text-muted-foreground" />
            <span className="text-[11px] font-medium">Call</span>
          </a>
          <a
            href={`mailto:${supplier.email}`}
            className="flex flex-col items-center gap-1 p-3 bg-card ring-1 ring-black/5 rounded-xl"
          >
            <Mail className="size-4 text-muted-foreground" />
            <span className="text-[11px] font-medium">Email</span>
          </a>
          {supplier.website && (
            <a
              href={`https://${supplier.website}`}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center gap-1 p-3 bg-card ring-1 ring-black/5 rounded-xl"
            >
              <Globe className="size-4 text-muted-foreground" />
              <span className="text-[11px] font-medium">Web</span>
            </a>
          )}
        </div>

        <div className="bg-card ring-1 ring-black/5 rounded-xl divide-y divide-black/5">
          <Row label="Phone" value={supplier.phone} />
          <Row label="Email" value={supplier.email} />
          {supplier.website && <Row label="Website" value={supplier.website} />}
        </div>

        <button className="w-full flex items-center justify-center gap-1.5 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium">
          <Plus className="size-4" />
          Create supplier task
        </button>

        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Related defects · {related.length}
          </h2>
          <div className="space-y-3">
            {related.map((d) => (
              <DefectCard key={d.id} defect={d} />
            ))}
            {related.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No defects routed to this supplier yet.
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
