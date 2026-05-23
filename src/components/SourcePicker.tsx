import { ChevronDown, Plus, X } from "lucide-react";
import type { DefectSource, Protocol } from "@/lib/types";

type Props = {
  value: DefectSource[];
  onChange: (next: DefectSource[]) => void;
  protocols: Protocol[];
};

export function SourcePicker({ value, onChange, protocols }: Props) {
  const noProtocols = protocols.length === 0;

  const updateRow = (index: number, patch: Partial<DefectSource>) => {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const removeRow = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const addRow = () => {
    if (noProtocols) return;
    onChange([...value, { protocolId: protocols[0].id, page: 1 }]);
  };

  return (
    <div className="space-y-2">
      {value.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <select
              value={row.protocolId}
              onChange={(e) => updateRow(i, { protocolId: e.target.value })}
              className="w-full appearance-none bg-card ring-1 ring-black/5 rounded-xl px-3 py-3 pl-9 text-sm focus:outline-none focus:ring-foreground/30"
            >
              {protocols.length === 0 && <option value="">—</option>}
              {!protocols.some((p) => p.id === row.protocolId) && row.protocolId && (
                <option value={row.protocolId}>(נמחק)</option>
              )}
              {protocols.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
          <input
            type="number"
            min={1}
            step={1}
            value={row.page}
            onChange={(e) => {
              const parsed = parseInt(e.target.value, 10);
              const next = Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
              updateRow(i, { page: next });
            }}
            aria-label="עמוד"
            className="w-20 bg-card ring-1 ring-black/5 rounded-xl px-3 py-3 text-sm text-center focus:outline-none focus:ring-foreground/30"
          />
          <button
            type="button"
            onClick={() => removeRow(i)}
            aria-label="הסר מקור"
            className="shrink-0 grid place-items-center size-9 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        disabled={noProtocols}
        className="inline-flex items-center gap-1 text-xs font-medium text-foreground bg-card ring-1 ring-black/5 rounded-full px-3 py-1.5 disabled:opacity-50"
      >
        <Plus className="size-3.5" />
        הוסף מקור
      </button>

      {noProtocols && (
        <p className="text-[11px] text-muted-foreground">
          העלה פרוטוקול בעמוד הדוחות כדי לקשר מקור.
        </p>
      )}
    </div>
  );
}
