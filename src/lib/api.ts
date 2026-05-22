import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Defect, Lookup, Supplier } from "./types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`${response.status} ${response.statusText}${text ? ` — ${text}` : ""}`);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export type DefectInput = Omit<Defect, "id" | "reportedAt" | "comments" | "activity"> & {
  reportedAt?: string;
};
export type DefectPatch = Partial<DefectInput>;
export type SupplierInput = Omit<Supplier, "id" | "initials"> & { initials?: string };
export type SupplierPatch = Partial<SupplierInput>;
export type CommentInput = { who: string; initials?: string; text: string; at?: string };

const defectsKey = ["defects"] as const;
const defectKey = (id: string) => ["defects", id] as const;
const suppliersKey = ["suppliers"] as const;
const supplierKey = (id: string) => ["suppliers", id] as const;

// --- Defects ---

export function useDefects() {
  return useQuery({
    queryKey: defectsKey,
    queryFn: () => request<Defect[]>("/api/defects"),
  });
}

export function useDefect(id: string | undefined) {
  return useQuery({
    queryKey: id ? defectKey(id) : ["defects", "missing"],
    queryFn: () => request<Defect>(`/api/defects/${id}`),
    enabled: !!id,
  });
}

export function useCreateDefect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DefectInput) =>
      request<Defect>("/api/defects", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: defectsKey }),
  });
}

export function useUpdateDefect(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: DefectPatch) =>
      request<Defect>(`/api/defects/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: (doc) => {
      qc.setQueryData(defectKey(id), doc);
      qc.invalidateQueries({ queryKey: defectsKey });
    },
  });
}

export function useDeleteDefect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => request<void>(`/api/defects/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: defectsKey }),
  });
}

export function useAddComment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CommentInput) =>
      request<Defect>(`/api/defects/${id}/comments`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (doc) => {
      qc.setQueryData(defectKey(id), doc);
      qc.invalidateQueries({ queryKey: defectsKey });
    },
  });
}

// --- Suppliers ---

export function useSuppliers() {
  return useQuery({
    queryKey: suppliersKey,
    queryFn: () => request<Supplier[]>("/api/suppliers"),
  });
}

export function useSupplier(id: string | undefined) {
  return useQuery({
    queryKey: id ? supplierKey(id) : ["suppliers", "missing"],
    queryFn: () => request<Supplier>(`/api/suppliers/${id}`),
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SupplierInput) =>
      request<Supplier>("/api/suppliers", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: suppliersKey }),
  });
}

export function useUpdateSupplier(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: SupplierPatch) =>
      request<Supplier>(`/api/suppliers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    onSuccess: (doc) => {
      qc.setQueryData(supplierKey(id), doc);
      qc.invalidateQueries({ queryKey: suppliersKey });
    },
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => request<void>(`/api/suppliers/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: suppliersKey }),
  });
}

// --- Lookups (rooms, trades) ---

function makeLookupHooks(resource: "rooms" | "trades") {
  const listKey = [resource] as const;
  return {
    useList() {
      return useQuery({
        queryKey: listKey,
        queryFn: () => request<Lookup[]>(`/api/${resource}`),
      });
    },
    useCreate() {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (name: string) =>
          request<Lookup>(`/api/${resource}`, {
            method: "POST",
            body: JSON.stringify({ name }),
          }),
        onSuccess: () => qc.invalidateQueries({ queryKey: listKey }),
      });
    },
    useDelete() {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (id: string) =>
          request<void>(`/api/${resource}/${id}`, { method: "DELETE" }),
        onSuccess: () => qc.invalidateQueries({ queryKey: listKey }),
      });
    },
  };
}

const roomHooks = makeLookupHooks("rooms");
const tradeHooks = makeLookupHooks("trades");

export const useRooms = roomHooks.useList;
export const useCreateRoom = roomHooks.useCreate;
export const useDeleteRoom = roomHooks.useDelete;

export const useTrades = tradeHooks.useList;
export const useCreateTrade = tradeHooks.useCreate;
export const useDeleteTrade = tradeHooks.useDelete;
