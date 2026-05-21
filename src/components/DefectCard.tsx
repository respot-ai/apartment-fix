import { Link } from "@tanstack/react-router";
import type { Defect } from "@/data/mock";
import { OwnerChip, PriorityChip, StatusChip } from "./Chips";

export function DefectCard({ defect }: { defect: Defect }) {
  return (
    <Link
      to="/defects/$id"
      params={{ id: defect.id }}
      className="block bg-card ring-1 ring-black/5 p-3 rounded-2xl flex gap-3 active:scale-[0.99] transition-transform"
    >
      <div
        className="size-20 shrink-0 rounded-xl ring-1 ring-black/5"
        style={{ backgroundImage: defect.photoBefore }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-medium uppercase tracking-tight text-muted-foreground">
            {defect.room}
          </span>
          <PriorityChip priority={defect.priority} />
        </div>
        <h3 className="text-sm font-medium leading-tight text-pretty mb-2 line-clamp-2">
          {defect.title}
        </h3>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs text-muted-foreground truncate">
              {defect.trade}
            </span>
            <OwnerChip owner={defect.owner} />
          </div>
          <StatusChip status={defect.status} />
        </div>
      </div>
    </Link>
  );
}
