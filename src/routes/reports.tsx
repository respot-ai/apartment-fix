import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef } from "react";
import {
  useDefects,
  useDeleteProtocol,
  useProtocols,
  useUploadProtocol,
} from "@/lib/api";
import { daysUntil, formatDate } from "@/lib/format";
import { ScreenHeader } from "@/components/ScreenHeader";
import { FileDown, FileText, MessageCircle, ChevronLeft, Trash2, Upload } from "lucide-react";
import type { Owner, Priority, Status } from "@/lib/types";

type DefectsSearch = {
  owner?: Owner;
  priority?: Priority;
  status?: Status;
  overdue?: boolean;
};

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
  const { data: defects = [] } = useDefects();
  const open = defects.filter((d) => d.status !== "fixed");
  const critical = open.filter((d) => d.priority === "critical").length;
  const contractor = open.filter((d) => d.owner === "contractor").length;
  const homeowner = open.filter((d) => d.owner === "homeowner").length;
  const third = open.filter((d) => d.owner === "third-party").length;
  const overdue = open.filter((d) => daysUntil(d.dueDate) < 0).length;
  const completed = defects.filter((d) => d.status === "fixed").length;

  const reports: {
    label: string;
    count: number;
    sub: string;
    critical?: boolean;
    search: DefectsSearch;
  }[] = [
    { label: "פגמים פתוחים לפי עדיפות", count: open.length, sub: `${critical} דחופים`, search: {} },
    { label: "באחריות הקבלן", count: contractor, sub: "ממתינים לתיקון", search: { owner: "contractor" } },
    { label: "באחריות הדייר", count: homeowner, sub: "טיפול עצמי", search: { owner: "homeowner" } },
    { label: "באחריות ספק", count: third, sub: "צד שלישי", search: { owner: "third-party" } },
    { label: "פריטים באיחור", count: overdue, sub: "עברו את תאריך היעד", critical: true, search: { overdue: true } },
    { label: "הושלמו", count: completed, sub: "עם הוכחת תיקון", search: { status: "fixed" } },
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
              <Link
                key={r.label}
                to="/"
                search={r.search}
                className="w-full flex items-center gap-3 p-3 bg-card ring-1 ring-black/5 rounded-xl text-right active:scale-[0.99] transition-transform"
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
              </Link>
            ))}
          </div>
        </div>

        <ProtocolsSection />

        <p className="text-[11px] text-muted-foreground text-center pt-2">
          יומן שינויים שומר כל עדכון של אחריות ותאריכים.
        </p>
      </div>
    </div>
  );
}

function ProtocolsSection() {
  const { data: protocols = [], isLoading } = useProtocols();
  const uploadProtocol = useUploadProtocol();
  const deleteProtocol = useDeleteProtocol();
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div>
      <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
        פרוטוקולי מסירה
      </h2>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          uploadProtocol.mutate(file);
          e.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploadProtocol.isPending}
        className="w-full py-2.5 px-3 bg-card ring-1 ring-dashed ring-black/15 text-foreground rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-60"
      >
        <Upload className="size-4" />
        {uploadProtocol.isPending ? "מעלה…" : "העלאת PDF"}
      </button>

      {uploadProtocol.error && (
        <p className="text-xs text-red-700 mt-2 text-center">
          העלאה נכשלה. נסה שוב.
        </p>
      )}

      <div className="space-y-2 mt-3">
        {!isLoading && protocols.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-3">
            אין פרוטוקולים שהועלו עדיין.
          </p>
        )}
        {protocols.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 p-3 bg-card ring-1 ring-black/5 rounded-xl"
          >
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 flex-1 min-w-0 text-right"
            >
              <div className="size-10 grid place-items-center rounded-lg bg-secondary text-foreground shrink-0">
                <FileText className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(p.uploadedAt)}
                  {typeof p.size === "number" ? ` · ${formatBytes(p.size)}` : ""}
                </p>
              </div>
            </a>
            <button
              type="button"
              disabled={deleteProtocol.isPending}
              onClick={() => {
                if (confirm(`למחוק את ${p.name}?`)) deleteProtocol.mutate(p.id);
              }}
              className="grid place-items-center size-8 rounded-full text-muted-foreground hover:bg-secondary hover:text-red-700 disabled:opacity-50 shrink-0"
              aria-label="מחק פרוטוקול"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
