import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import {
  useCreateDefect,
  useProtocols,
  useRooms,
  useSuppliers,
  useTrades,
  useUploadImage,
} from "@/lib/api";
import { THIRD_PARTY_OWNER_ID, type DefectSource, type Owner, type Priority } from "@/lib/types";
import { SourcePicker } from "@/components/SourcePicker";
import { Camera, ChevronDown, ImagePlus, Loader2, Trash2 } from "lucide-react";

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
  const { data: protocols = [] } = useProtocols();
  const [room, setRoom] = useState("");
  const [trade, setTrade] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [owner, setOwner] = useState<Owner>("contractor");
  const [supplierId, setSupplierId] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [sources, setSources] = useState<DefectSource[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const uploadImage = useUploadImage();
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const missingTitle = !title.trim();
  const missingRoom = !room;
  const missingTrade = !trade;
  const hasMissing = missingTitle || missingRoom || missingTrade;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      try {
        const url = await uploadImage.mutateAsync(file);
        setPhotos((prev) => (prev.includes(url) ? prev : [...prev, url]));
      } catch {
        // surface via uploadImage.isError below
      }
    }
  };

  const removePhoto = (url: string) => {
    setPhotos((prev) => prev.filter((p) => p !== url));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (hasMissing) {
          setShowErrors(true);
          return;
        }
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
            sources: sources.filter((s) => s.protocolId),
            supplierId: owner === THIRD_PARTY_OWNER_ID && supplierId ? supplierId : undefined,
            photos,
            photoBefore: photos[0] ?? "",
            photoAfter: photos[1],
          },
          { onSuccess: () => navigate({ to: "/" }) },
        );
      }}
    >
      <ScreenHeader back="/" title="פגם חדש" subtitle="תיעוד והקצאה" />

      <div className="px-5 space-y-5 pb-6">
        <Group label="כותרת">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="כותרת קצרה של הפגם"
            className={`w-full bg-card ring-1 rounded-xl px-3 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-foreground/30 ${
              showErrors && missingTitle ? "ring-red-500" : "ring-black/5"
            }`}
          />
          {showErrors && missingTitle && (
            <p className="text-xs text-red-700 mt-1">נדרשת כותרת</p>
          )}
        </Group>

        <div className="grid grid-cols-2 gap-3">
          <Group label="אזור">
            <Select
              value={room}
              onChange={setRoom}
              options={rooms.map((r) => r.name)}
              placeholder="בחר"
              invalid={showErrors && missingRoom}
            />
            {showErrors && missingRoom && (
              <p className="text-xs text-red-700 mt-1">בחר אזור</p>
            )}
          </Group>
          <Group label="תחום">
            <Select
              value={trade}
              onChange={setTrade}
              options={trades.map((t) => t.name)}
              placeholder="בחר"
              invalid={showErrors && missingTrade}
            />
            {showErrors && missingTrade && (
              <p className="text-xs text-red-700 mt-1">בחר תחום</p>
            )}
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

        {owner === THIRD_PARTY_OWNER_ID && (
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

        <Group label="תמונות">
          <div className="grid grid-cols-3 gap-2">
            {photos.map((url) => (
              <div
                key={url}
                className="relative aspect-square rounded-xl ring-1 ring-black/5 overflow-hidden bg-secondary"
              >
                <img src={url} alt="" className="size-full object-cover" loading="lazy" />
                <button
                  type="button"
                  onClick={() => removePhoto(url)}
                  className="absolute top-1.5 right-1.5 grid place-items-center size-7 rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/75 focus:outline-none focus:ring-2 focus:ring-white/60"
                  aria-label="מחק תמונה"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploadImage.isPending}
              className="aspect-square rounded-xl ring-1 ring-dashed ring-black/15 bg-card grid place-items-center text-muted-foreground hover:text-foreground hover:ring-black/30 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-foreground/30"
              aria-label="צלם תמונה"
            >
              {uploadImage.isPending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Camera className="size-5" />
                  <span className="text-[10px] font-medium">מצלמה</span>
                </div>
              )}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadImage.isPending}
              className="aspect-square rounded-xl ring-1 ring-dashed ring-black/15 bg-card grid place-items-center text-muted-foreground hover:text-foreground hover:ring-black/30 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-foreground/30"
              aria-label="העלה מהמכשיר"
            >
              <div className="flex flex-col items-center gap-1">
                <ImagePlus className="size-5" />
                <span className="text-[10px] font-medium">קובץ</span>
              </div>
            </button>
          </div>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          {uploadImage.isError && (
            <p className="text-xs text-red-700 mt-2">העלאת תמונה נכשלה. נסה שוב.</p>
          )}
        </Group>

        <Group label="מקורות">
          <SourcePicker value={sources} onChange={setSources} protocols={protocols} />
        </Group>

        {showErrors && hasMissing && (
          <p className="text-xs text-red-700">יש להשלים את כל שדות החובה</p>
        )}
        {createDefect.isError && <p className="text-xs text-red-700">שמירה נכשלה. נסה שוב.</p>}

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
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Opt[];
  placeholder: string;
  invalid?: boolean;
}) {
  const normalized = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full appearance-none bg-card ring-1 rounded-xl px-3 py-3 pl-9 text-sm focus:outline-none focus:ring-foreground/30 ${
          invalid ? "ring-red-500" : "ring-black/5"
        }`}
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
