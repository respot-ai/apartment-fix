import type {
  AgreementState,
  Defect,
  Owner,
  Priority,
  Status,
} from "@/data/mock";

export const priorityRank: Record<Priority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const priorityLabel: Record<Priority, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const statusLabel: Record<Status, string> = {
  new: "New",
  agreed: "Agreed",
  scheduled: "Scheduled",
  "in-progress": "In progress",
  fixed: "Fixed",
  verified: "Verified",
  disputed: "Disputed",
};

export const ownerLabel: Record<Owner, string> = {
  contractor: "Contractor",
  homeowner: "Homeowner",
  supplier: "Supplier",
  "third-party": "Third party",
};

export const agreementLabel: Record<AgreementState, string> = {
  "waiting-contractor": "Waiting for contractor",
  "waiting-homeowner": "Waiting for homeowner",
  locked: "Agreement locked",
  disputed: "Disputed",
};

export function sortDefects(list: Defect[]): Defect[] {
  return [...list].sort(
    (a, b) =>
      priorityRank[a.priority] - priorityRank[b.priority] ||
      a.dueDate.localeCompare(b.dueDate),
  );
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function shortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}
