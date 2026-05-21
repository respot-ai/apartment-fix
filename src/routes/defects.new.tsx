import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Camera, ChevronDown } from "lucide-react";

export const Route = createFileRoute("/defects/new")({
  head: () => ({
    meta: [
      { title: "Add defect — Handover Tracker" },
      { name: "description", content: "Log a new apartment handover defect with photos, room, trade, priority, and owner." },
    ],
  }),
  component: AddDefect,
});

const rooms = ["Entrance", "Living Room", "Kitchen", "Master Bedroom", "Bath 1", "Balcony", "Hallway"];
const trades = ["Doors", "Entrance Door", "Aluminum/Windows", "Kitchen", "Sanitary", "AC", "Solar", "MMAD", "Electrical", "Plumbing", "Flooring", "Paint", "Carpentry", "Balcony"];
const priorities = ["critical", "high", "medium", "low"] as const;
const owners = ["contractor", "homeowner", "supplier", "third-party"] as const;

function AddDefect() {
  const navigate = useNavigate();
  const [room, setRoom] = useState("");
  const [trade, setTrade] = useState("");
  const [priority, setPriority] = useState<(typeof priorities)[number]>("medium");
  const [owner, setOwner] = useState<(typeof owners)[number]>("contractor");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        navigate({ to: "/defects" });
      }}
    >
      <ScreenHeader back="/defects" title="New defect" subtitle="Document and assign" />

      <div className="px-5 space-y-5 pb-6">
        {/* Photo capture */}
        <button
          type="button"
          className="w-full aspect-video bg-card ring-1 ring-dashed ring-black/15 rounded-2xl grid place-items-center text-center"
        >
          <div>
            <Camera className="size-6 text-muted-foreground mx-auto mb-1.5" />
            <p className="text-sm font-medium">Take or upload photo</p>
            <p className="text-xs text-muted-foreground mt-0.5">Up to 6 images</p>
          </div>
        </button>

        <Group label="Title">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short defect title"
            className="w-full bg-card ring-1 ring-black/5 rounded-xl px-3 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-foreground/30"
          />
        </Group>

        <div className="grid grid-cols-2 gap-3">
          <Group label="Room">
            <Select value={room} onChange={setRoom} options={rooms} placeholder="Select" />
          </Group>
          <Group label="Trade">
            <Select value={trade} onChange={setTrade} options={trades} placeholder="Select" />
          </Group>
        </div>

        <Group label="Description">
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            placeholder="Exact location and what's wrong"
            className="w-full bg-card ring-1 ring-black/5 rounded-xl px-3 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-foreground/30 resize-none"
          />
        </Group>

        <Group label="Priority">
          <div className="grid grid-cols-4 gap-2">
            {priorities.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setPriority(p)}
                className={`py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                  priority === p
                    ? "bg-primary text-primary-foreground"
                    : "bg-card ring-1 ring-black/5 text-muted-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </Group>

        <Group label="Suggested owner">
          <div className="grid grid-cols-2 gap-2">
            {owners.map((o) => (
              <button
                type="button"
                key={o}
                onClick={() => setOwner(o)}
                className={`py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                  owner === o
                    ? "bg-primary text-primary-foreground"
                    : "bg-card ring-1 ring-black/5 text-muted-foreground"
                }`}
              >
                {o.replace("-", " ")}
              </button>
            ))}
          </div>
        </Group>

        <Group label="Due date">
          <input
            type="date"
            className="w-full bg-card ring-1 ring-black/5 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-foreground/30"
          />
        </Group>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <Link
            to="/defects"
            className="py-3 bg-card ring-1 ring-black/5 text-foreground rounded-xl text-sm font-medium text-center"
          >
            Save as draft
          </Link>
          <button
            type="submit"
            className="py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
          >
            Submit
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

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-card ring-1 ring-black/5 rounded-xl px-3 py-3 pr-9 text-sm focus:outline-none focus:ring-foreground/30"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
    </div>
  );
}
