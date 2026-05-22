import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useCreateDefect, useRooms, useSuppliers, useTrades } from "@/lib/api";
import type { Owner, Priority } from "@/lib/types";
import { Camera, ChevronDown } from "lucide-react";

export const Route = createFileRoute("/defects/new")({
  head: () => ({
    meta: [
      { title: "פגם חדש — מעקב מסירת דירה" },
      { name: "description", content: "תיעוד פגם חדש בדירה." },
    ],
  }),
  component: AddDefect,
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

function AddDefect() {
  const navigate = useNavigate();
  const createDefect = useCreateDefect();
  const { data: suppliers = [] } = useSuppliers();
  const { data: rooms = [] } = useRooms();
  const { data: trades = [] } = useTrades();
  const [room, setRoom] = useState("");
  const [trade, setTrade] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [owner, setOwner] = useState<Owner>("contractor");
  const [supplierId, setSupplierId] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [dueDate, setDueDate] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim() || !room || !trade || !dueDate) return;
        createDefect.mutate(
          {
            title: title.trim(),
            room,
            location: "",
            trade,
            priority,
            owner,
            status: "new",
            dueDate,
            description: desc,
            protocolRef: "",
            supplierId: owner === "third-party" && supplierId ? supplierId : undefined,
            photoBefore: "",
          },
          { onSuccess: () => navigate({ to: "/" }) },
        );
      }}
    >
      <ScreenHeader back="/" title="פגם חדש" subtitle="תיעוד והקצאה" />

      <div className="px-5 space-y-5 pb-6">
        <button
          type="button"
          className="w-full aspect-video bg-card ring-1 ring-dashed ring-black/15 rounded-2xl grid place-items-center text-center"
        >
          <div>
            <Camera className="size-6 text-muted-foreground mx-auto mb-1.5" />
            <p className="text-sm font-medium">צלם או העלה תמונה</p>
            <p className="text-xs text-muted-foreground mt-0.5">עד 6 תמונות</p>
          </div>
        </button>

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

        <Group label="תאריך יעד">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-card ring-1 ring-black/5 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-foreground/30"
          />
        </Group>

        {createDefect.isError && (
          <p className="text-xs text-red-700">שמירה נכשלה. נסה שוב.</p>
        )}

        <div className="grid grid-cols-2 gap-2 pt-2">
          <Link
            to="/"
            className="py-3 bg-card ring-1 ring-black/5 text-foreground rounded-xl text-sm font-medium text-center"
          >
            ביטול
          </Link>
          <button
            type="submit"
            disabled={createDefect.isPending}
            className="py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {createDefect.isPending ? "שומר…" : "שמור"}
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
