import { createFileRoute } from "@tanstack/react-router";
import { defects } from "@/data/mock";
import { daysUntil } from "@/lib/format";
import { ScreenHeader } from "@/components/ScreenHeader";
import { FileDown, MessageCircle, ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "דוחות — מעקב מסירת דירה" },
      { name: "description", content: "ייצוא PDF ושיתוף בוואטסאפ של פגמים פתוחים." },
    ],
  }),
  component: Reports,
});

function Reports() {
  const open = defects.filter((d) => d.status !== "fixed");
  const critical = open.filter((d) => d.priority === "critical").length;
  const contractor = open.filter((d) => d.owner === "contractor").length;
  const homeowner = open.filter((d) => d.owner === "homeowner").length;
  const third = open.filter((d) => d.owner === "third-party").length;
  const overdue = open.filter((d) => daysUntil(d.dueDate) < 0).length;
  const completed = defects.filter((d) => d.status === "fixed").length;

  const reports = [
    { label: "פגמים פתוחים לפי עדיפות", count: open.length, sub: `${critical} דחופים` },
    { label: "באחריות הקבלן", count: contractor, sub: "ממתינים לתיקון" },
    { label: "באחריות הדייר", count: homeowner, sub: "טיפול עצמי" },
    { label: "באחריות ספק", count: third, sub: "צד שלישי" },
    { label: "פריטים באיחור", count: overdue, sub: "עברו את תאריך היעד", critical: true },
    { label: "הושלמו", count: completed, sub: "עם הוכחת תיקון" },
  ];

  return (
    <div>
      <ScreenHeader title="דוחות" subtitle="שיתוף עם בעלי עניין" />
      <div className="px-5 pb-6 space-y-5">
        <div className="bg-card ring-1 ring-black/5 rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            דוח מסירה מלא
          </p>
          <p className="text-sm font-medium mb-3">
            PDF אחד עם כל הפגמים, אחראים, סטטוס ותמונות.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button className="py-2.5 px-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium flex items-center justify-center gap-1.5">
              <FileDown className="size-4" />
              ייצוא PDF
            </button>
            <button className="py-2.5 px-3 bg-card ring-1 ring-black/5 text-foreground rounded-xl text-sm font-medium flex items-center justify-center gap-1.5">
              <MessageCircle className="size-4" />
              וואטסאפ
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            פילוחים לשיתוף
          </h2>
          <div className="space-y-2">
            {reports.map((r) => (
              <button
                key={r.label}
                className="w-full flex items-center gap-3 p-3 bg-card ring-1 ring-black/5 rounded-xl text-right"
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
                <ChevronLeft className="size-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground text-center pt-2">
          יומן שינויים שומר כל עדכון של אחריות ותאריכים.
        </p>
      </div>
    </div>
  );
}
