import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { upload } from "@vercel/blob/client";
import type { Defect, Lookup, Protocol, Supplier } from "./types";

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

export type DefectInput = Omit<
  Defect,
  "id" | "shortId" | "reportedAt" | "comments" | "activity"
> & {
  reportedAt?: string;
};
export type DefectPatch = Partial<DefectInput>;
export type SupplierInput = Omit<Supplier, "id" | "initials"> & { initials?: string };
export type SupplierPatch = Partial<SupplierInput>;
export type CommentInput = { who: string; initials?: string; text: string; at?: string };

const defectsKey = ["defects"] as const;
const suppliersKey = ["suppliers"] as const;

const persistentListOptions = {
  staleTime: Infinity,
  gcTime: Infinity,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
} as const;

// --- Defects ---

export function useDefects() {
  return useQuery({
    queryKey: defectsKey,
    queryFn: () => request<Defect[]>("/api/defects"),
    ...persistentListOptions,
  });
}

function replaceInList(qc: ReturnType<typeof useQueryClient>, doc: Defect) {
  qc.setQueryData<Defect[]>(defectsKey, (prev) =>
    prev ? prev.map((d) => (d.id === doc.id ? doc : d)) : prev,
  );
}

export function useCreateDefect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DefectInput) =>
      request<Defect>("/api/defects", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (doc) => {
      const prev = qc.getQueryData<Defect[]>(defectsKey);
      if (prev) {
        qc.setQueryData<Defect[]>(defectsKey, [...prev, doc]);
      } else {
        qc.invalidateQueries({ queryKey: defectsKey });
      }
    },
  });
}

export function useUpdateDefect(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: DefectPatch) =>
      request<Defect>(`/api/defects/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: (doc) => replaceInList(qc, doc),
  });
}

export function useDeleteDefect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => request<void>(`/api/defects/${id}`, { method: "DELETE" }),
    onSuccess: (_, id) => {
      qc.setQueryData<Defect[]>(defectsKey, (prev) =>
        prev ? prev.filter((d) => d.id !== id) : prev,
      );
    },
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
    onSuccess: (doc) => replaceInList(qc, doc),
  });
}

export function useUpdateComment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, text }: { commentId: string; text: string }) =>
      request<Defect>(`/api/defects/${id}/comments/${commentId}`, {
        method: "PATCH",
        body: JSON.stringify({ text }),
      }),
    onSuccess: (doc) => replaceInList(qc, doc),
  });
}

export function useDeleteComment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) =>
      request<Defect>(`/api/defects/${id}/comments/${commentId}`, { method: "DELETE" }),
    onSuccess: (doc) => replaceInList(qc, doc),
  });
}

// --- Uploads ---

export function useUploadImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const blob = await upload(`defects/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/uploads",
        contentType: file.type || "image/jpeg",
      });
      return blob.url;
    },
  });
}

// --- Protocols ---

const protocolsKey = ["protocols"] as const;

export function useProtocols() {
  return useQuery({
    queryKey: protocolsKey,
    queryFn: () => request<Protocol[]>("/api/protocols"),
    ...persistentListOptions,
  });
}

export function useUploadProtocol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const blob = await upload(`protocols/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/uploads",
        contentType: file.type || "application/pdf",
      });
      return request<Protocol>("/api/protocols", {
        method: "POST",
        body: JSON.stringify({ name: file.name, url: blob.url, size: file.size }),
      });
    },
    onSuccess: (doc) => {
      const prev = qc.getQueryData<Protocol[]>(protocolsKey);
      if (prev) {
        qc.setQueryData<Protocol[]>(protocolsKey, [...prev, doc]);
      } else {
        qc.invalidateQueries({ queryKey: protocolsKey });
      }
    },
  });
}

export function useDeleteProtocol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => request<void>(`/api/protocols/${id}`, { method: "DELETE" }),
    onSuccess: (_, id) => {
      qc.setQueryData<Protocol[]>(protocolsKey, (prev) =>
        prev ? prev.filter((p) => p.id !== id) : prev,
      );
    },
  });
}

// --- Suppliers ---

export function useSuppliers() {
  return useQuery({
    queryKey: suppliersKey,
    queryFn: () => request<Supplier[]>("/api/suppliers"),
    ...persistentListOptions,
  });
}

function replaceSupplierInList(qc: ReturnType<typeof useQueryClient>, doc: Supplier) {
  qc.setQueryData<Supplier[]>(suppliersKey, (prev) =>
    prev ? prev.map((s) => (s.id === doc.id ? doc : s)) : prev,
  );
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SupplierInput) =>
      request<Supplier>("/api/suppliers", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (doc) => {
      const prev = qc.getQueryData<Supplier[]>(suppliersKey);
      if (prev) {
        qc.setQueryData<Supplier[]>(suppliersKey, [...prev, doc]);
      } else {
        qc.invalidateQueries({ queryKey: suppliersKey });
      }
    },
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
    onSuccess: (doc) => replaceSupplierInList(qc, doc),
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => request<void>(`/api/suppliers/${id}`, { method: "DELETE" }),
    onSuccess: (_, id) => {
      qc.setQueryData<Supplier[]>(suppliersKey, (prev) =>
        prev ? prev.filter((s) => s.id !== id) : prev,
      );
    },
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
        ...persistentListOptions,
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
        onSuccess: (doc) => {
          const prev = qc.getQueryData<Lookup[]>(listKey);
          if (prev) {
            qc.setQueryData<Lookup[]>(listKey, [...prev, doc]);
          } else {
            qc.invalidateQueries({ queryKey: listKey });
          }
        },
      });
    },
    useDelete() {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (id: string) => request<void>(`/api/${resource}/${id}`, { method: "DELETE" }),
        onSuccess: (_, id) => {
          qc.setQueryData<Lookup[]>(listKey, (prev) =>
            prev ? prev.filter((l) => l.id !== id) : prev,
          );
        },
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
