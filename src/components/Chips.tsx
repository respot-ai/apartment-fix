import type { Owner, Priority, Status } from "@/data/mock";
import { ownerLabel, priorityLabel, statusLabel } from "@/lib/format";

const statusDot: Record<Status, string> = {
  new: "bg-[var(--warning)]",
  "in-progress": "bg-[var(--info)]",
  fixed: "bg-[var(--success)]",
};

export function PriorityChip({ priority }: { priority: Priority }) {
  if (priority === "critical") {
    return (
      <span className="text-[10px] font-medium px-1.5 py-0.5 bg-red-50 text-red-700 rounded ring-1 ring-red-200">
        {priorityLabel.critical}
      </span>
    );
  }
  if (priority === "high") {
    return (
      <span className="text-[10px] font-medium px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded ring-1 ring-amber-200">
        {priorityLabel.high}
      </span>
    );
  }
  return (
    <span className="text-[10px] font-medium px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded ring-1 ring-black/5">
      {priorityLabel[priority]}
    </span>
  );
}

export function StatusChip({ status }: { status: Status }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`size-1.5 rounded-full ${statusDot[status]}`} />
      <span className="text-xs font-medium text-zinc-600">
        {statusLabel[status]}
      </span>
    </div>
  );
}

const ownerStyle: Record<Owner, string> = {
  contractor: "bg-amber-50 text-amber-700 ring-amber-200",
  homeowner: "bg-blue-50 text-blue-700 ring-blue-200",
  "third-party": "bg-violet-50 text-violet-700 ring-violet-200",
};

export function OwnerChip({ owner }: { owner: Owner }) {
  return (
    <span
      className={`text-[10px] font-medium px-1.5 py-0.5 rounded ring-1 ${ownerStyle[owner]}`}
    >
      {ownerLabel[owner]}
    </span>
  );
}
