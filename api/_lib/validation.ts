import { z } from "zod";

const priority = z.enum(["critical", "high", "medium", "low"]);
const owner = z.enum(["contractor", "homeowner", "third-party"]);
const status = z.enum(["new", "in-progress", "fixed"]);
const trade = z.string().min(1).max(80);

const defectSource = z.object({
  protocolId: z.string().min(1),
  page: z.number().int().positive(),
});

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
  sources: z.array(defectSource).optional(),
  supplierId: z.string().optional(),
  photoBefore: z.string().default(""),
  photoAfter: z.string().optional(),
  photos: z.array(z.string()).optional(),
  photoMeta: z.record(z.string(), z.object({ rotation: z.number().optional() })).optional(),
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

export const protocolCreateSchema = z.object({
  name: z.string().min(1).max(200),
  url: z.string().url(),
  size: z.number().int().nonnegative().optional(),
});
