import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ChevronDown } from "lucide-react";

export const Route = createFileRoute("/suppliers/new")({
  head: () => ({
    meta: [
      { title: "ספק חדש — מעקב מסירת דירה" },
      { name: "description", content: "הוסף ספק חדש לרשימה." },
    ],
  }),
  component: NewSupplier,
});

const trades = ["דלתות", "דלת כניסה", "אלומיניום/חלונות", "מטבח", "סניטרי", "מיזוג", "סולארי", "מולטימדיה", "חשמל", "אינסטלציה", "ריצוף", "צבע", "נגרות", "מרפסת"];

function NewSupplier() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        navigate({ to: "/suppliers" });
      }}
    >
      <ScreenHeader back="/suppliers" title="ספק חדש" subtitle="פרטי איש קשר" />
      <div className="px-5 space-y-5 pb-6">
        <Group label="שם הספק">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="לדוגמה: דלתות לוין"
            className="w-full bg-card ring-1 ring-black/5 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-foreground/30"
          />
        </Group>
        <Group label="תחום">
          <div className="relative">
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full appearance-none bg-card ring-1 ring-black/5 rounded-xl px-3 py-3 pl-9 text-sm focus:outline-none focus:ring-foreground/30"
            >
              <option value="" disabled>בחר תחום</option>
              {trades.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <ChevronDown className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </Group>
        <Group label="טלפון">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="03-1234567"
            type="tel"
            className="w-full bg-card ring-1 ring-black/5 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-foreground/30"
          />
        </Group>
        <Group label="אימייל">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="service@example.co.il"
            type="email"
            className="w-full bg-card ring-1 ring-black/5 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-foreground/30"
          />
        </Group>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <Link
            to="/suppliers"
            className="py-3 bg-card ring-1 ring-black/5 text-foreground rounded-xl text-sm font-medium text-center"
          >
            ביטול
          </Link>
          <button
            type="submit"
            className="py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
          >
            שמור ספק
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
