import { createFileRoute, Link } from "@tanstack/react-router";
import { suppliers, defects } from "@/data/mock";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Phone, Mail, ChevronLeft, Plus } from "lucide-react";

export const Route = createFileRoute("/suppliers/")({
  head: () => ({
    meta: [
      { title: "ספקים — מעקב מסירת דירה" },
      { name: "description", content: "ספקים וגורמי צד שלישי לפי תחום." },
    ],
  }),
  component: SupplierDirectory,
});

function SupplierDirectory() {
  const grouped = suppliers.reduce<Record<string, typeof suppliers>>((acc, s) => {
    (acc[s.domain] ||= []).push(s);
    return acc;
  }, {});

  return (
    <div>
      <ScreenHeader
        title="ספקים"
        subtitle={`${suppliers.length} ספקים`}
        right={
          <Link
            to="/suppliers/new"
            className="size-10 grid place-items-center bg-primary text-primary-foreground rounded-full"
            aria-label="הוסף ספק"
          >
            <Plus className="size-5" />
          </Link>
        }
      />
      <div className="px-5 pb-6 space-y-6">
        {Object.entries(grouped).map(([domain, list]) => (
          <section key={domain}>
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              {domain}
            </h2>
            <div className="space-y-2">
              {list.map((s) => {
                const related = defects.filter((d) => d.supplierId === s.id);
                return (
                  <Link
                    key={s.id}
                    to="/suppliers/$id"
                    params={{ id: s.id }}
                    className="flex items-center gap-3 p-3 bg-card ring-1 ring-black/5 rounded-xl"
                  >
                    <div className="size-10 grid place-items-center bg-secondary rounded-lg text-xs font-semibold">
                      {s.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {related.length} {related.length === 1 ? "פגם משויך" : "פגמים משויכים"}
                      </p>
                    </div>
                    <a
                      href={`tel:${s.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="size-9 grid place-items-center bg-secondary rounded-lg ring-1 ring-black/5"
                    >
                      <Phone className="size-4 text-muted-foreground" />
                    </a>
                    <a
                      href={`mailto:${s.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="size-9 grid place-items-center bg-secondary rounded-lg ring-1 ring-black/5"
                    >
                      <Mail className="size-4 text-muted-foreground" />
                    </a>
                    <ChevronLeft className="size-4 text-muted-foreground" />
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
