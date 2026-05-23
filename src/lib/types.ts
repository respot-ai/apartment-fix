export type Priority = "critical" | "high" | "medium" | "low";
export type Owner = "contractor" | "homeowner" | "third-party";
export const THIRD_PARTY_OWNER_ID: Owner = "third-party";
export type Status = "new" | "in-progress" | "fixed";

export type Supplier = {
  id: string;
  name: string;
  domain: string;
  phone: string;
  email: string;
  website?: string;
  initials: string;
};

export type Lookup = {
  id: string;
  name: string;
};

export type ActivityEntry = {
  id: string;
  who: string;
  initials: string;
  text: string;
  at: string;
};

export type Comment = {
  id: string;
  who: string;
  initials: string;
  text: string;
  at: string;
};

export type Defect = {
  id: string;
  shortId: string;
  title: string;
  room: string;
  location: string;
  trade: string;
  priority: Priority;
  owner: Owner;
  status: Status;
  dueDate: string;
  reportedAt: string;
  description: string;
  protocolRef: string;
  supplierId?: string;
  photoBefore: string;
  photoAfter?: string;
  photos?: string[];
  photoMeta?: Record<string, { rotation?: number }>;
  comments: Comment[];
  activity: ActivityEntry[];
};

export const apartmentLabel = "דירה 402 · סקייוויו רזידנסס";
export const protocolSignedAt = "24 בספטמבר 2024";
