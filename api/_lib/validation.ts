import { z } from "zod";

const priority = z.enum(["critical", "high", "medium", "low"]);
const owner = z.enum(["contractor", "homeowner", "third-party"]);
const status = z.enum(["new", "in-progress", "fixed"]);
const trade = z.string().min(1).max(80);

export const defectCreateSchema = z.object({
  title: z.string().min(1),
  room: z.string().min(1),
  location: z.string().default(""),
  trade: trade,
  priority: priority,
  owner: owner,
  status: status.default("new"),
  dueDate: z.string().default(""),
  reportedAt: z.string().optional(),
  description: z.string().default(""),
  protocolRef: z.string().default(""),
  supplierId: z.string().optional(),
  photoBefore: z.string().default(""),
  photoAfter: z.string().optional(),
});

export const defectUpdateSchema = defectCreateSchema.partial();

export const supplierCreateSchema = z.object({
  name: z.string().min(1),
  domain: trade,
  phone: z.string().default(""),
  email: z.string().default(""),
  website: z.string().optional(),
  initials: z.string().default(""),
});

export const supplierUpdateSchema = supplierCreateSchema.partial();

export const commentCreateSchema = z.object({
  who: z.string().min(1),
  initials: z.string().default(""),
  text: z.string().min(1),
  at: z.string().optional(),
});
