import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useDefect, useRooms, useSuppliers, useTrades, useUpdateDefect } from "@/lib/api";
import type { Owner, Priority } from "@/lib/types";
import { ChevronDown } from "lucide-react";

export const Route = createFileRoute("/edit-defect/$id")({
  head: () => ({
    meta: [
      { title: "עריכת פגם — מעקב מסירת דירה" },
      { name: "description", content: "עריכת פרטי פגם קיים." },
    ],
  }),
  component: EditDefect,
});

const priorities = [
  { id: "critical", label: "דחוף" },
  { id: "high", label: "גבוה" },
  { id: "medium", label: "בינוני" },
  { id: "low", label: "נמוך" },
] as const;
const owners = [
  { id: "contractor", label: "קבלן" },
  { id: "homeowner", label: "דייר" },
  { id: "third-party", label: "ספק" },
] as const;

function EditDefect() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: defect, isLoading, error } = useDefect(id);
  const updateDefect = useUpdateDefect(id);
  const { data: suppliers = [] } = useSuppliers();
  const { data: rooms = [] } = useRooms();
  const { data: trades = [] } = useTrades();

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

  return <EditDefectForm defectId={id} initial={defect} suppliers={suppliers} rooms={rooms} trades={trades} updateDefect={updateDefect} navigate={navigate} />;
}

type EditFormProps = {
  defectId: string;
  initial: NonNullable<ReturnType<typeof useDefect>["data"]>;
  suppliers: ReturnType<typeof useSuppliers>["data"] extends infer T ? Exclude<T, undefined> : never;
  rooms: ReturnType<typeof useRooms>["data"] extends infer T ? Exclude<T, undefined> : never;
  trades: ReturnType<typeof useTrades>["data"] extends infer T ? Exclude<T, undefined> : never;
  updateDefect: ReturnType<typeof useUpdateDefect>;
  navigate: ReturnType<typeof useNavigate>;
};

function EditDefectForm({ defectId, initial, suppliers, rooms, trades, updateDefect, navigate }: EditFormProps) {
  const [room, setRoom] = useState(initial.room);
  const [trade, setTrade] = useState(initial.trade);
  const [priority, setPriority] = useState<Priority>(initial.priority);
  const [owner, setOwner] = useState<Owner>(initial.owner);
  const [supplierId, setSupplierId] = useState(initial.supplierId ?? "");
  const [title, setTitle] = useState(initial.title);
  const [desc, setDesc] = useState(initial.description);
  const [dueDate, setDueDate] = useState(initial.dueDate);
  const [reportedAt, setReportedAt] = useState(initial.reportedAt);
  const [protocolRef, setProtocolRef] = useState(initial.protocolRef);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim() || !room || !trade) return;
        updateDefect.mutate(
          {
            title: title.trim(),
            room,
            trade,
            priority,
            owner,
            dueDate,
            reportedAt,
            protocolRef,
            description: desc,
            supplierId: owner === "third-party" && supplierId ? supplierId : undefined,
          },
          { onSuccess: () => navigate({ to: "/defects/$id", params: { id: defectId } }) },
        );
      }}
    >
      <ScreenHeader back={`/defects/${defectId}`} title="עריכת פגם" subtitle="עדכון פרטים" />

      <div className="px-5 space-y-5 pb-6">
        <Group label="כותרת">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="כותרת קצרה של הפגם"
            className="w-full bg-card ring-1 ring-black/5 rounded-xl px-3 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-foreground/30"
          />
        </Group>

        <div className="grid grid-cols-2 gap-3">
          <Group label="אזור">
            <Select value={room} onChange={setRoom} options={rooms.map((r) => r.name)} placeholder="בחר" />
          </Group>
          <Group label="תחום">
            <Select value={trade} onChange={setTrade} options={trades.map((t) => t.name)} placeholder="בחר" />
          </Group>
        </div>

        <Group label="תיאור">
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            placeholder="מיקום מדויק ומה הבעיה"
            className="w-full bg-card ring-1 ring-black/5 rounded-xl px-3 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-foreground/30 resize-none"
          />
        </Group>

        <Group label="עדיפות">
          <div className="grid grid-cols-4 gap-2">
            {priorities.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => setPriority(p.id)}
                className={`py-2 rounded-lg text-xs font-medium transition-colors ${
                  priority === p.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-card ring-1 ring-black/5 text-muted-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </Group>

        <Group label="אחראי">
          <div className="grid grid-cols-3 gap-2">
            {owners.map((o) => (
              <button
                type="button"
                key={o.id}
                onClick={() => setOwner(o.id)}
                className={`py-2 rounded-lg text-xs font-medium transition-colors ${
                  owner === o.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-card ring-1 ring-black/5 text-muted-foreground"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </Group>

        {owner === "third-party" && (
          <Group label="בחר ספק מהרשימה">
            <Select
              value={supplierId}
              onChange={setSupplierId}
              options={suppliers.map((s) => ({ value: s.id, label: `${s.name} · ${s.domain}` }))}
              placeholder="בחר ספק"
            />
            <Link
              to="/suppliers/new"
              className="text-xs font-medium text-foreground underline mt-2 inline-block"
            >
              + הוסף ספק חדש
            </Link>
          </Group>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Group label="תאריך יעד">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-card ring-1 ring-black/5 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-foreground/30"
            />
          </Group>
          <Group label="דווח ב‑">
            <input
              type="date"
              value={reportedAt}
              onChange={(e) => setReportedAt(e.target.value)}
              className="w-full bg-card ring-1 ring-black/5 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-foreground/30"
            />
          </Group>
        </div>

        <Group label="מקור (פרוטוקול / עמוד)">
          <input
            value={protocolRef}
            onChange={(e) => setProtocolRef(e.target.value)}
            placeholder="לדוגמה: page 12"
            className="w-full bg-card ring-1 ring-black/5 rounded-xl px-3 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-foreground/30"
          />
        </Group>

        {updateDefect.isError && (
          <p className="text-xs text-red-700">שמירה נכשלה. נסה שוב.</p>
        )}

        <div className="grid grid-cols-2 gap-2 pt-2">
          <Link
            to="/defects/$id"
            params={{ id: defectId }}
            className="py-3 bg-card ring-1 ring-black/5 text-foreground rounded-xl text-sm font-medium text-center"
          >
            ביטול
          </Link>
          <button
            type="submit"
            disabled={updateDefect.isPending}
            className="py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {updateDefect.isPending ? "שומר…" : "שמור"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
        {label}
      </p>
      {children}
    </div>
  );
}

type Opt = string | { value: string; label: string };

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Opt[];
  placeholder: string;
}) {
  const normalized = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  );
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-card ring-1 ring-black/5 rounded-xl px-3 py-3 pl-9 text-sm focus:outline-none focus:ring-foreground/30"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {normalized.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
    </div>
  );
}
