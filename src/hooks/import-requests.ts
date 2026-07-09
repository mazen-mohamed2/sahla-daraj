import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  seedImportRequests,
  seedOffers,
  seedAuditLog,
  type ImportRequest,
  type Offer,
  type AuditLog,
  type TimelineEvent,
  type ImportStatus,
  type OfferStatus,
} from "@/services/import-data";
import { notify } from "@/store/notifications";
import { useAuthStore } from "@/store/auth";

const RK = ["import-requests"] as const;
const OK = (id?: string) => (id ? (["offers", id] as const) : (["offers"] as const));
const AK = ["audit-log"] as const;
const EK = ["escrows"] as const;

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));
const uid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
const tev = (type: TimelineEvent["type"], message: string, actor?: string): TimelineEvent => ({
  id: uid("t"),
  type,
  message,
  at: new Date().toISOString(),
  actor,
});

function ensureSeeded(qc: QueryClient) {
  if (!qc.getQueryData(RK)) qc.setQueryData(RK, seedImportRequests());
  if (!qc.getQueryData(OK())) {
    const reqs = qc.getQueryData<ImportRequest[]>(RK) ?? [];
    qc.setQueryData(OK(), seedOffers(reqs));
  }
  if (!qc.getQueryData(AK)) qc.setQueryData(AK, seedAuditLog());
}

function pushAudit(qc: QueryClient, log: Omit<AuditLog, "id" | "at">) {
  qc.setQueryData<AuditLog[]>(AK, (old = []) => [
    { ...log, id: uid("al"), at: new Date().toISOString() },
    ...old,
  ]);
}

export const useImportRequestsV2 = () => {
  const qc = useQueryClient();
  return useQuery({
    queryKey: RK,
    queryFn: async () => {
      await delay();
      ensureSeeded(qc);
      return qc.getQueryData<ImportRequest[]>(RK) ?? seedImportRequests();
    },
  });
};

export const useImportRequest = (id: string | undefined) => {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ["import-request", id],
    queryFn: async () => {
      await delay();
      ensureSeeded(qc);
      const list = qc.getQueryData<ImportRequest[]>(RK) ?? [];
      return list.find((r) => r.id === id) ?? null;
    },
    enabled: !!id,
  });
};

export const useOffers = (requestId?: string) => {
  const qc = useQueryClient();
  return useQuery({
    queryKey: OK(requestId),
    queryFn: async () => {
      await delay();
      ensureSeeded(qc);
      const all = qc.getQueryData<Offer[]>(OK()) ?? [];
      return requestId ? all.filter((o) => o.requestId === requestId) : all;
    },
  });
};

export const useAllOffers = () => {
  const qc = useQueryClient();
  return useQuery({
    queryKey: OK(),
    queryFn: async () => {
      await delay();
      ensureSeeded(qc);
      return qc.getQueryData<Offer[]>(OK()) ?? [];
    },
  });
};

export const useAuditLog = () => {
  const qc = useQueryClient();
  return useQuery({
    queryKey: AK,
    queryFn: async () => {
      await delay();
      ensureSeeded(qc);
      return qc.getQueryData<AuditLog[]>(AK) ?? seedAuditLog();
    },
  });
};

type CreateInput = Omit<
  ImportRequest,
  "id" | "requesterId" | "requester" | "status" | "createdAt" | "updatedAt" | "deadline" | "timeline" | "adminNotes"
> & { deadlineDays?: number };

export const useCreateImportRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateInput) => {
      await delay(500);
      const auth = useAuthStore.getState();
      const now = new Date().toISOString();
      const req: ImportRequest = {
        ...input,
        id: uid("IR"),
        requesterId: auth.phone,
        requester: auth.name,
        status: "open",
        createdAt: now,
        updatedAt: now,
        deadline: new Date(Date.now() + (input.deadlineDays ?? 14) * 86_400_000).toISOString(),
        timeline: [
          { id: uid("t"), type: "created", message: "تم إنشاء الطلب ونشره", at: now, actor: auth.name },
        ],
        adminNotes: "",
      };
      return req;
    },
    onSuccess: (req) => {
      ensureSeeded(qc);
      qc.setQueryData<ImportRequest[]>(RK, (old = []) => [req, ...old]);
      pushAudit(qc, { actor: req.requester, action: "create", targetType: "import_request", targetId: req.id });
      notify("agency", {
        title: "طلب استيراد جديد",
        message: `${req.brand} ${req.model} ${req.year} — ${req.destination}`,
        category: "import",
        relatedEntityType: "import_request",
        relatedEntityId: req.id,
        actionUrl: "/agency/bids",
        priority: "high",
      });
    },
  });
};

export const useUpdateImportRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<ImportRequest> & { id: string }) => {
      await delay(400);
      return patch;
    },
    onSuccess: (patch) => {
      qc.setQueryData<ImportRequest[]>(RK, (old = []) =>
        old.map((r) =>
          r.id === patch.id
            ? {
                ...r,
                ...patch,
                updatedAt: new Date().toISOString(),
                timeline: [...r.timeline, tev("updated", "تم تعديل بيانات الطلب", r.requester)],
              }
            : r,
        ),
      );
      pushAudit(qc, { actor: "user", action: "update", targetType: "import_request", targetId: patch.id });
    },
  });
};

export const useDuplicateImportRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await delay(400);
      const source = (qc.getQueryData<ImportRequest[]>(RK) ?? []).find((r) => r.id === id);
      if (!source) throw new Error("Request not found");
      const now = new Date().toISOString();
      const copy: ImportRequest = {
        ...source,
        id: uid("IR"),
        status: "open",
        createdAt: now,
        updatedAt: now,
        acceptedOfferId: undefined,
        escrowId: undefined,
        timeline: [{ id: uid("t"), type: "created", message: "تم إنشاء نسخة من طلب سابق", at: now, actor: source.requester }],
        adminNotes: "",
      };
      return copy;
    },
    onSuccess: (copy) => {
      qc.setQueryData<ImportRequest[]>(RK, (old = []) => [copy, ...old]);
      pushAudit(qc, { actor: copy.requester, action: "duplicate", targetType: "import_request", targetId: copy.id });
    },
  });
};

export const useCancelImportRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      await delay(400);
      return { id, reason };
    },
    onSuccess: ({ id, reason }) => {
      const req = (qc.getQueryData<ImportRequest[]>(RK) ?? []).find((r) => r.id === id);
      qc.setQueryData<ImportRequest[]>(RK, (old = []) =>
        old.map((r) =>
          r.id === id
            ? {
                ...r,
                status: "cancelled" as ImportStatus,
                updatedAt: new Date().toISOString(),
                timeline: [...r.timeline, tev("cancelled", reason ? `تم الإلغاء: ${reason}` : "تم إلغاء الطلب", r.requester)],
              }
            : r,
        ),
      );
      // Auto-reject all pending offers
      qc.setQueryData<Offer[]>(OK(), (old = []) =>
        old.map((o) => (o.requestId === id && o.status === "pending" ? { ...o, status: "rejected", updatedAt: new Date().toISOString() } : o)),
      );
      pushAudit(qc, { actor: req?.requester ?? "user", action: "cancel", targetType: "import_request", targetId: id, meta: reason });
      // Notify agencies that had pending offers
      const affected = (qc.getQueryData<Offer[]>(OK()) ?? []).filter((o) => o.requestId === id);
      const seen = new Set<string>();
      affected.forEach((o) => {
        if (seen.has(o.agencyId)) return;
        seen.add(o.agencyId);
        notify("agency", {
          title: "تم إلغاء طلب استيراد",
          message: `الطلب ${id} تم إلغاؤه من قبل العميل`,
          category: "import",
          relatedEntityType: "import_request",
          relatedEntityId: id,
          actionUrl: "/agency/bids",
          priority: "medium",
        });
      });
    },
  });
};

// ============ Offers ============

export type OfferInput = Omit<Offer, "id" | "status" | "createdAt" | "updatedAt" | "agencyId" | "agencyName" | "agencyRating" | "completedDeals">;

export const useCreateOffer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: OfferInput) => {
      await delay(600);
      const auth = useAuthStore.getState();
      const now = new Date().toISOString();
      const offer: Offer = {
        ...input,
        id: uid("OF"),
        agencyId: auth.phone,
        agencyName: auth.name,
        agencyRating: 4.7,
        completedDeals: 42,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      };
      return offer;
    },
    onSuccess: (offer) => {
      ensureSeeded(qc);
      qc.setQueryData<Offer[]>(OK(), (old = []) => [offer, ...old]);
      qc.setQueryData<ImportRequest[]>(RK, (old = []) =>
        old.map((r) =>
          r.id === offer.requestId
            ? {
                ...r,
                status: r.status === "open" ? ("bidding" as ImportStatus) : r.status,
                updatedAt: new Date().toISOString(),
                timeline: [...r.timeline, tev("offer_received", `عرض جديد من ${offer.agencyName}`, offer.agencyName)],
              }
            : r,
        ),
      );
      pushAudit(qc, { actor: offer.agencyName, action: "create_offer", targetType: "offer", targetId: offer.id });
      const req = (qc.getQueryData<ImportRequest[]>(RK) ?? []).find((r) => r.id === offer.requestId);
      notify("user", {
        title: "عرض جديد على طلب الاستيراد",
        message: `${offer.agencyName} قدم عرضاً على ${req?.brand} ${req?.model}`,
        category: "import",
        relatedEntityType: "import_request",
        relatedEntityId: offer.requestId,
        actionUrl: "/user/import-requests",
        priority: "high",
      });
    },
  });
};

export const useUpdateOffer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Offer> & { id: string }) => {
      await delay(400);
      return patch;
    },
    onSuccess: (patch) => {
      qc.setQueryData<Offer[]>(OK(), (old = []) =>
        old.map((o) => (o.id === patch.id ? { ...o, ...patch, updatedAt: new Date().toISOString() } : o)),
      );
      pushAudit(qc, { actor: "agency", action: "update_offer", targetType: "offer", targetId: patch.id });
    },
  });
};

export const useWithdrawOffer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await delay(300); return id; },
    onSuccess: (id) => {
      const offer = (qc.getQueryData<Offer[]>(OK()) ?? []).find((o) => o.id === id);
      qc.setQueryData<Offer[]>(OK(), (old = []) => old.filter((o) => o.id !== id));
      if (offer) {
        qc.setQueryData<ImportRequest[]>(RK, (old = []) =>
          old.map((r) =>
            r.id === offer.requestId
              ? { ...r, timeline: [...r.timeline, tev("offer_withdrawn", `${offer.agencyName} سحب عرضه`, offer.agencyName)] }
              : r,
          ),
        );
        pushAudit(qc, { actor: offer.agencyName, action: "withdraw_offer", targetType: "offer", targetId: id });
      }
    },
  });
};

export const useAcceptOffer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ offerId, requestId }: { offerId: string; requestId: string }) => {
      await delay(600);
      return { offerId, requestId };
    },
    onSuccess: ({ offerId, requestId }) => {
      const offer = (qc.getQueryData<Offer[]>(OK()) ?? []).find((o) => o.id === offerId);
      const req = (qc.getQueryData<ImportRequest[]>(RK) ?? []).find((r) => r.id === requestId);
      if (!offer || !req) return;
      const now = new Date().toISOString();

      // Mark this offer accepted; reject siblings
      qc.setQueryData<Offer[]>(OK(), (old = []) =>
        old.map((o) =>
          o.requestId === requestId
            ? o.id === offerId
              ? { ...o, status: "accepted", updatedAt: now }
              : o.status === "pending"
                ? { ...o, status: "rejected", updatedAt: now }
                : o
            : o,
        ),
      );

      // Create mock escrow
      const escrowId = uid("E");
      const totalAmount = offer.price + offer.shippingCost;
      qc.setQueryData<Array<{ id: string; listing: string; counterparty: string; amount: number; status: string; reason: string; createdAt: string }>>(
        EK,
        (old = []) => [
          {
            id: escrowId,
            listing: `${req.brand} ${req.model} ${req.year}`,
            counterparty: offer.agencyName,
            amount: totalAmount,
            status: "holding",
            reason: "",
            createdAt: now,
          },
          ...old,
        ],
      );

      // Close request + append timeline
      qc.setQueryData<ImportRequest[]>(RK, (old = []) =>
        old.map((r) =>
          r.id === requestId
            ? {
                ...r,
                status: "accepted" as ImportStatus,
                acceptedOfferId: offerId,
                escrowId,
                updatedAt: now,
                timeline: [
                  ...r.timeline,
                  tev("offer_accepted", `تم قبول عرض ${offer.agencyName} بقيمة ${offer.price} ج.م`, r.requester),
                  tev("escrow_created", `تم إنشاء ضمان ${escrowId} بقيمة ${totalAmount} ج.م`, "النظام"),
                ],
              }
            : r,
        ),
      );

      pushAudit(qc, { actor: req.requester, action: "accept_offer", targetType: "offer", targetId: offerId, meta: escrowId });

      notify("user", {
        title: "تم قبول العرض وفتح ضمان",
        message: `تم إنشاء ضمان ${escrowId} — تواصل مع ${offer.agencyName}`,
        category: "escrow",
        relatedEntityType: "escrow",
        relatedEntityId: escrowId,
        actionUrl: "/user/escrow",
        priority: "high",
      });
      notify("agency", {
        title: "تم قبول عرضك",
        message: `قبل العميل عرضك بقيمة ${offer.price.toLocaleString("ar-EG")} ج.م`,
        category: "import",
        relatedEntityType: "import_request",
        relatedEntityId: requestId,
        actionUrl: "/agency/bids",
        priority: "high",
      });
      notify("admin", {
        title: "تم إنشاء ضمان جديد",
        message: `ضمان ${escrowId} من طلب استيراد ${requestId}`,
        category: "escrow",
        relatedEntityType: "escrow",
        relatedEntityId: escrowId,
        actionUrl: "/admin/financial",
        priority: "medium",
      });
    },
  });
};

export const useRejectOffer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ offerId, reason }: { offerId: string; reason?: string }) => {
      await delay(400);
      return { offerId, reason };
    },
    onSuccess: ({ offerId, reason }) => {
      const offer = (qc.getQueryData<Offer[]>(OK()) ?? []).find((o) => o.id === offerId);
      qc.setQueryData<Offer[]>(OK(), (old = []) =>
        old.map((o) => (o.id === offerId ? { ...o, status: "rejected" as OfferStatus, updatedAt: new Date().toISOString() } : o)),
      );
      if (offer) {
        qc.setQueryData<ImportRequest[]>(RK, (old = []) =>
          old.map((r) =>
            r.id === offer.requestId
              ? { ...r, timeline: [...r.timeline, tev("offer_rejected", `تم رفض عرض ${offer.agencyName}${reason ? ` — ${reason}` : ""}`, r.requester)] }
              : r,
          ),
        );
        pushAudit(qc, { actor: "user", action: "reject_offer", targetType: "offer", targetId: offerId, meta: reason });
        notify("agency", {
          title: "تم رفض عرضك",
          message: reason ? `السبب: ${reason}` : `على طلب ${offer.requestId}`,
          category: "import",
          relatedEntityType: "import_request",
          relatedEntityId: offer.requestId,
          actionUrl: "/agency/bids",
          priority: "medium",
        });
      }
    },
  });
};

// ============ Admin actions ============

export const useAdminSetRequestStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: ImportStatus; reason?: string }) => {
      await delay(400);
      return { id, status, reason };
    },
    onSuccess: ({ id, status, reason }) => {
      qc.setQueryData<ImportRequest[]>(RK, (old = []) =>
        old.map((r) =>
          r.id === id
            ? {
                ...r,
                status,
                flagReason: status === "flagged" ? reason ?? r.flagReason : r.flagReason,
                updatedAt: new Date().toISOString(),
                timeline: [
                  ...r.timeline,
                  tev(
                    status === "closed" ? "closed" : status === "open" ? "reopened" : status === "flagged" ? "flagged" : status === "hidden" ? "hidden" : "updated",
                    status === "closed" ? "تم إغلاق الطلب من الإدارة" : status === "open" ? "تم إعادة فتح الطلب" : status === "flagged" ? `تم الإبلاغ عن الطلب${reason ? `: ${reason}` : ""}` : status === "hidden" ? "تم إخفاء الطلب" : `تحديث الحالة إلى ${status}`,
                    "الإدارة",
                  ),
                ],
              }
            : r,
        ),
      );
      pushAudit(qc, { actor: "admin", action: `admin_${status}`, targetType: "import_request", targetId: id, meta: reason });
      notify("user", {
        title: status === "closed" ? "تم إغلاق طلبك من الإدارة" : status === "flagged" ? "تم الإبلاغ عن طلبك" : status === "hidden" ? "تم إخفاء طلبك" : "تم تحديث حالة طلبك",
        message: `طلب الاستيراد ${id}${reason ? ` — ${reason}` : ""}`,
        category: "import",
        relatedEntityType: "import_request",
        relatedEntityId: id,
        actionUrl: "/user/import-requests",
        priority: "medium",
      });
    },
  });
};

export const useAdminAddNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      await delay(300);
      return { id, note };
    },
    onSuccess: ({ id, note }) => {
      qc.setQueryData<ImportRequest[]>(RK, (old = []) =>
        old.map((r) =>
          r.id === id
            ? {
                ...r,
                adminNotes: note,
                updatedAt: new Date().toISOString(),
                timeline: [...r.timeline, tev("admin_note", `ملاحظة إدارية: ${note}`, "الإدارة")],
              }
            : r,
        ),
      );
      pushAudit(qc, { actor: "admin", action: "note", targetType: "import_request", targetId: id, meta: note });
    },
  });
};
