import type { Defect, Owner, Priority, Status } from "@/lib/types";

export const priorityRank: Record<Priority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const priorityLabel: Record<Priority, string> = {
  critical: "דחוף",
  high: "גבוה",
  medium: "בינוני",
  low: "נמוך",
};

export const statusLabel: Record<Status, string> = {
  new: "חדש",
  "in-progress": "בטיפול",
  fixed: "הושלם",
};

export const ownerLabel: Record<Owner, string> = {
  contractor: "קבלן",
  homeowner: "דייר",
  "third-party": "ספק",
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
    return new Date(iso).toLocaleDateString("he-IL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function shortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("he-IL", {
      day: "numeric",
      month: "short",
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
