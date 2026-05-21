import { createFileRoute } from "@tanstack/react-router";
import { defects } from "@/data/mock";
import { daysUntil } from "@/lib/format";
import { ScreenHeader } from "@/components/ScreenHeader";
import { FileDown, MessageCircle, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Handover Tracker" },
      { name: "description", content: "Generate shareable PDF reports of open defects, owners, and completed items." },
    ],
  }),
  component: Reports,
});

function Reports() {
  const open = defects.filter((d) => d.status !== "verified");
  const critical = open.filter((d) => d.priority === "critical").length;
  const contractor = open.filter((d) => d.owner === "contractor").length;
  const homeowner = open.filter((d) => d.owner === "homeowner").length;
  const supplier = open.filter((d) => d.owner === "supplier").length;
  const overdue = open.filter((d) => daysUntil(d.dueDate) < 0).length;
  const completed = defects.filter((d) => d.status === "fixed" || d.status === "verified").length;

  const reports = [
    { label: "Open defects by priority", count: open.length, sub: `${critical} critical` },
    { label: "Contractor-owned items", count: contractor, sub: "Awaiting fix" },
    { label: "Homeowner-owned items", count: homeowner, sub: "Self-handled" },
    { label: "Supplier-needed items", count: supplier, sub: "Third-party" },
    { label: "Overdue items", count: overdue, sub: "Past due date", critical: true },
    { label: "Completed & verified", count: completed, sub: "Proof attached" },
  ];

  return (
    <div>
      <ScreenHeader title="Reports" subtitle="Share with stakeholders" />
      <div className="px-5 pb-6 space-y-5">
        <div className="bg-card ring-1 ring-black/5 rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Full handover report
          </p>
          <p className="text-sm font-medium mb-3">
            One PDF with every defect, owner, status, and proof photo.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button className="py-2.5 px-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium flex items-center justify-center gap-1.5">
              <FileDown className="size-4" />
              Export PDF
            </button>
            <button className="py-2.5 px-3 bg-card ring-1 ring-black/5 text-foreground rounded-xl text-sm font-medium flex items-center justify-center gap-1.5">
              <MessageCircle className="size-4" />
              WhatsApp
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Slice & share
          </h2>
          <div className="space-y-2">
            {reports.map((r) => (
              <button
                key={r.label}
                className="w-full flex items-center gap-3 p-3 bg-card ring-1 ring-black/5 rounded-xl text-left"
              >
                <div
                  className={`size-12 grid place-items-center rounded-lg text-base font-semibold ${
                    r.critical
                      ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  {r.count}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{r.label}</p>
                  <p className="text-xs text-muted-foreground">{r.sub}</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground text-center pt-2">
          Audit log keeps responsibility and due-date changes traceable.
        </p>
      </div>
    </div>
  );
}
