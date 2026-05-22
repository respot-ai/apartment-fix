import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import {
  useCreateRoom,
  useCreateTrade,
  useDeleteRoom,
  useDeleteTrade,
  useRooms,
  useTrades,
} from "@/lib/api";
import type { Lookup } from "@/lib/types";
import { Plus, X } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "הגדרות — מעקב מסירת דירה" },
      { name: "description", content: "ניהול אזורים ותחומים." },
    ],
  }),
  component: Settings,
});

function Settings() {
  return (
    <div>
      <ScreenHeader back="/" title="הגדרות" subtitle="אזורים ותחומים" />
      <div className="px-5 pb-6 space-y-6">
        <LookupSection
          label="אזורים"
          placeholder="לדוגמה: חדר עבודה"
          useList={useRooms}
          useCreate={useCreateRoom}
          useDelete={useDeleteRoom}
        />
        <LookupSection
          label="תחומים"
          placeholder="לדוגמה: גינון"
          useList={useTrades}
          useCreate={useCreateTrade}
          useDelete={useDeleteTrade}
        />
      </div>
    </div>
  );
}

type LookupSectionProps = {
  label: string;
  placeholder: string;
  useList: () => { data?: Lookup[]; isLoading: boolean };
  useCreate: () => {
    mutate: (name: string, options?: { onSuccess?: () => void }) => void;
    isPending: boolean;
  };
  useDelete: () => { mutate: (id: string) => void; isPending: boolean };
};

function LookupSection({ label, placeholder, useList, useCreate, useDelete }: LookupSectionProps) {
  const { data: items = [], isLoading } = useList();
  const create = useCreate();
  const remove = useDelete();
  const [draft, setDraft] = useState("");

  return (
    <section>
      <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
        {label}
      </h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const name = draft.trim();
          if (!name) return;
          create.mutate(name, { onSuccess: () => setDraft("") });
        }}
        className="flex gap-2 mb-3"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-card ring-1 ring-black/5 rounded-xl px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-foreground/30"
        />
        <button
          type="submit"
          disabled={!draft.trim() || create.isPending}
          className="size-10 grid place-items-center bg-primary text-primary-foreground rounded-full disabled:opacity-50"
          aria-label="הוסף"
        >
          <Plus className="size-5" />
        </button>
      </form>

      {isLoading && items.length === 0 && (
        <p className="text-xs text-muted-foreground py-3">טוען…</p>
      )}

      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between bg-card ring-1 ring-black/5 rounded-xl px-3 py-2.5"
          >
            <span className="text-sm">{item.name}</span>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`למחוק את "${item.name}"?`)) {
                  remove.mutate(item.id);
                }
              }}
              disabled={remove.isPending}
              className="size-7 grid place-items-center text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`מחק ${item.name}`}
            >
              <X className="size-4" />
            </button>
          </li>
        ))}
        {!isLoading && items.length === 0 && (
          <li className="text-xs text-muted-foreground py-3 text-center">
            ריק. הוסף פריט ראשון למעלה.
          </li>
        )}
      </ul>
    </section>
  );
}
