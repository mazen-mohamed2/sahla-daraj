import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  seedEscrows,
  type Escrow,
  type EscrowDocument,
  type EscrowDocumentKind,
  type EscrowPaymentMethod,
  type EscrowStatus,
  type EscrowTimelineEvent,
  type EscrowTimelineType,
  type EscrowTracking,
  type EscrowDispute,
  type DisputeStatus,
} from "@/services/escrow-data";
import { notify } from "@/store/notifications";
import { useAuthStore } from "@/store/auth";
import type { WalletBalance, WalletTx } from "@/hooks/wallet";

const EK = ["escrows"] as const;
const BAL_KEY = ["wallet-balance"] as const;
const TX_KEY = ["wallet-tx"] as const;

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));
const uid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

function tev(type: EscrowTimelineType, message: string, actor?: string): EscrowTimelineEvent {
  return { id: uid("tev"), type, message, at: new Date().toISOString(), actor };
}

function ensureSeeded(qc: QueryClient) {
  if (!qc.getQueryData(EK)) {
    const auth = useAuthStore.getState();
    qc.setQueryData(EK, seedEscrows(auth.phone, auth.name));
  }
}

function patchEscrow(qc: QueryClient, id: string, patch: (e: Escrow) => Escrow) {
  qc.setQueryData<Escrow[]>(EK, (old = []) => old.map((e) => (e.id === id ? patch(e) : e)));
}

// ================= Queries =================

export const useEscrowsV2 = () => {
  const qc = useQueryClient();
  return useQuery({
    queryKey: EK,
    queryFn: async () => {
      await delay(400);
      ensureSeeded(qc);
      return qc.getQueryData<Escrow[]>(EK) ?? [];
    },
    staleTime: Infinity,
  });
};

// Alias — matches the historical hook name so older imports keep working.
export const useEscrows = useEscrowsV2;

export const useEscrow = (id: string | undefined) => {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ["escrow", id],
    queryFn: async () => {
      await delay(200);
      ensureSeeded(qc);
      return (qc.getQueryData<Escrow[]>(EK) ?? []).find((e) => e.id === id) ?? null;
    },
    enabled: !!id,
  });
};

// ================= Helpers =================

function walletDebit(qc: QueryClient, amount: number, escrowId: string) {
  qc.setQueryData<WalletBalance>(BAL_KEY, (old) =>
    old ? { ...old, available: Math.max(0, old.available - amount), total: Math.max(0, old.total - amount) } : old,
  );
  const tx: WalletTx = {
    id: uid("WT"),
    type: "escrow_hold",
    status: "completed",
    amount,
    description: `حجز ضمان — ${escrowId}`,
    escrowId,
    reference: `REF-${Date.now().toString().slice(-6)}`,
    createdAt: new Date().toISOString(),
  };
  qc.setQueryData<WalletTx[]>(TX_KEY, (old = []) => [tx, ...old]);
}

function walletCredit(qc: QueryClient, amount: number, escrowId: string, type: "escrow_release" | "deposit", description: string) {
  qc.setQueryData<WalletBalance>(BAL_KEY, (old) =>
    old ? { ...old, available: old.available + amount, total: old.total + amount } : old,
  );
  const tx: WalletTx = {
    id: uid("WT"),
    type,
    status: "completed",
    amount,
    description,
    escrowId,
    reference: `REF-${Date.now().toString().slice(-6)}`,
    createdAt: new Date().toISOString(),
  };
  qc.setQueryData<WalletTx[]>(TX_KEY, (old = []) => [tx, ...old]);
}

// ================= Buyer mutations =================

export const usePayEscrow = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, method }: { id: string; method: EscrowPaymentMethod }) => {
      await delay(700);
      return { id, method };
    },
    onSuccess: ({ id, method }) => {
      const esc = (qc.getQueryData<Escrow[]>(EK) ?? []).find((e) => e.id === id);
      if (!esc) return;
      const total = esc.amount + esc.shippingCost;
      if (method === "wallet") walletDebit(qc, total, id);
      const now = new Date().toISOString();
      patchEscrow(qc, id, (e) => ({
        ...e,
        status: "paid",
        paymentMethod: method,
        paidAt: now,
        updatedAt: now,
        timeline: [...e.timeline, tev("payment_completed", `تم استلام الدفع (${total.toLocaleString("ar-EG")} ج.م)`, esc.buyerName)],
        documents: [...e.documents, { id: uid("doc"), kind: "invoice" as EscrowDocumentKind, name: `invoice-${id}.pdf`, uploadedBy: "النظام", uploadedAt: now }],
      }));
      notify("user", { title: "تم استلام الدفع", message: `تم دفع مبلغ الضمان ${id}`, category: "escrow", relatedEntityType: "escrow", relatedEntityId: id, actionUrl: "/user/escrow", priority: "medium" });
      notify("agency", { title: "تم استلام الدفع", message: `دفع المشتري مبلغ ضمان ${id}`, category: "escrow", relatedEntityType: "escrow", relatedEntityId: id, actionUrl: "/agency/escrow", priority: "high" });
      notify("admin", { title: "دفع ضمان", message: `تم دفع الضمان ${id}`, category: "escrow", relatedEntityType: "escrow", relatedEntityId: id, actionUrl: "/admin/escrow", priority: "low" });
    },
  });
};

export const useConfirmDelivery = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => { await delay(500); return { id }; },
    onSuccess: ({ id }) => {
      const esc = (qc.getQueryData<Escrow[]>(EK) ?? []).find((e) => e.id === id);
      if (!esc) return;
      patchEscrow(qc, id, (e) => ({
        ...e,
        status: "released",
        updatedAt: new Date().toISOString(),
        timeline: [
          ...e.timeline,
          tev("buyer_confirmed", "أكد المشتري الاستلام", e.buyerName),
          tev("funds_released", `تم الإفراج عن ${(e.amount + e.shippingCost).toLocaleString("ar-EG")} ج.م للمعرض`, "النظام"),
        ],
      }));
      notify("agency", { title: "تم الإفراج عن الأموال", message: `تم إيداع ${(esc.amount + esc.shippingCost).toLocaleString("ar-EG")} ج.م لحسابك من ضمان ${id}`, category: "escrow", relatedEntityType: "escrow", relatedEntityId: id, actionUrl: "/agency/escrow", priority: "high" });
      notify("user", { title: "شكراً لتأكيدك", message: `تم إتمام صفقة ${id} بنجاح`, category: "escrow", relatedEntityType: "escrow", relatedEntityId: id, actionUrl: "/user/escrow", priority: "medium" });
      notify("admin", { title: "إفراج عن ضمان", message: `تم إغلاق الضمان ${id} بنجاح`, category: "escrow", relatedEntityType: "escrow", relatedEntityId: id, actionUrl: "/admin/escrow", priority: "low" });
    },
  });
};

export const useOpenDispute = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason, description, attachmentName }: { id: string; reason: string; description: string; attachmentName?: string }) => {
      await delay(500);
      return { id, reason, description, attachmentName };
    },
    onSuccess: ({ id, reason, description, attachmentName }) => {
      const esc = (qc.getQueryData<Escrow[]>(EK) ?? []).find((e) => e.id === id);
      if (!esc) return;
      const now = new Date().toISOString();
      const dispute: EscrowDispute = {
        id: uid("DSP"), openedBy: esc.buyerName, reason, description, attachmentName,
        status: "open", createdAt: now, updatedAt: now,
      };
      patchEscrow(qc, id, (e) => ({
        ...e,
        status: "disputed",
        dispute,
        reason,
        updatedAt: now,
        timeline: [...e.timeline, tev("dispute_opened", `فتح المشتري نزاعاً: ${reason}`, esc.buyerName)],
      }));
      notify("admin", { title: "نزاع جديد", message: `فتح المشتري نزاعاً على الضمان ${id} — ${reason}`, category: "escrow", relatedEntityType: "dispute", relatedEntityId: id, actionUrl: "/admin/escrow", priority: "high" });
      notify("agency", { title: "تم فتح نزاع", message: `المشتري فتح نزاعاً على ضمان ${id}`, category: "escrow", relatedEntityType: "escrow", relatedEntityId: id, actionUrl: "/agency/escrow", priority: "high" });
      notify("user", { title: "تم فتح النزاع", message: `سيتم مراجعة نزاع ${id} خلال 24 ساعة`, category: "escrow", relatedEntityType: "escrow", relatedEntityId: id, actionUrl: "/user/escrow", priority: "medium" });
    },
  });
};

export const useRequestRefund = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => { await delay(400); return { id, reason }; },
    onSuccess: ({ id, reason }) => {
      const esc = (qc.getQueryData<Escrow[]>(EK) ?? []).find((e) => e.id === id);
      if (!esc) return;
      patchEscrow(qc, id, (e) => ({
        ...e,
        updatedAt: new Date().toISOString(),
        notes: `${e.notes}${e.notes ? "\n" : ""}[طلب استرداد] ${reason}`,
        timeline: [...e.timeline, tev("note", `طلب المشتري استرداداً: ${reason}`, esc.buyerName)],
      }));
      notify("admin", { title: "طلب استرداد", message: `طلب استرداد على ضمان ${id} — ${reason}`, category: "escrow", relatedEntityType: "escrow", relatedEntityId: id, actionUrl: "/admin/escrow", priority: "high" });
      notify("user", { title: "تم إرسال طلب الاسترداد", message: `سيقوم فريقنا بمراجعة طلبك خلال 48 ساعة`, category: "escrow", relatedEntityType: "escrow", relatedEntityId: id, actionUrl: "/user/escrow", priority: "medium" });
    },
  });
};

// ================= Agency mutations =================

export const useConfirmPurchase = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => { await delay(500); return { id }; },
    onSuccess: ({ id }) => {
      const esc = (qc.getQueryData<Escrow[]>(EK) ?? []).find((e) => e.id === id);
      if (!esc) return;
      patchEscrow(qc, id, (e) => ({
        ...e,
        status: "purchased",
        updatedAt: new Date().toISOString(),
        timeline: [...e.timeline, tev("purchase_confirmed", "أكد المعرض شراء السيارة", esc.agencyName)],
      }));
      notify("user", { title: "تم شراء سيارتك", message: `أكد المعرض شراء السيارة لضمان ${id}`, category: "escrow", relatedEntityType: "escrow", relatedEntityId: id, actionUrl: "/user/escrow", priority: "high" });
      notify("admin", { title: "تحديث ضمان", message: `تم شراء سيارة الضمان ${id}`, category: "escrow", relatedEntityType: "escrow", relatedEntityId: id, actionUrl: "/admin/escrow", priority: "low" });
    },
  });
};

export const useStartShipping = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, tracking }: { id: string; tracking: EscrowTracking }) => { await delay(500); return { id, tracking }; },
    onSuccess: ({ id, tracking }) => {
      const esc = (qc.getQueryData<Escrow[]>(EK) ?? []).find((e) => e.id === id);
      if (!esc) return;
      patchEscrow(qc, id, (e) => ({
        ...e,
        status: "shipping",
        tracking,
        updatedAt: new Date().toISOString(),
        timeline: [
          ...e.timeline,
          tev("shipping_started", `بدأ الشحن عبر ${tracking.shippingCompany}`, esc.agencyName),
          tev("tracking_updated", `رقم التتبع: ${tracking.trackingNumber}`, esc.agencyName),
        ],
      }));
      notify("user", { title: "بدأ شحن سيارتك", message: `يمكنك متابعة الشحنة عبر رقم التتبع ${tracking.trackingNumber}`, category: "escrow", relatedEntityType: "escrow", relatedEntityId: id, actionUrl: "/user/escrow", priority: "high" });
      notify("admin", { title: "بدء شحن", message: `بدء شحن ضمان ${id}`, category: "escrow", relatedEntityType: "escrow", relatedEntityId: id, actionUrl: "/admin/escrow", priority: "low" });
    },
  });
};

export const useUpdateTracking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, tracking }: { id: string; tracking: Partial<EscrowTracking> }) => { await delay(400); return { id, tracking }; },
    onSuccess: ({ id, tracking }) => {
      const esc = (qc.getQueryData<Escrow[]>(EK) ?? []).find((e) => e.id === id);
      if (!esc) return;
      patchEscrow(qc, id, (e) => {
        const next: EscrowTracking = {
          trackingNumber: tracking.trackingNumber ?? e.tracking?.trackingNumber ?? "",
          shippingCompany: tracking.shippingCompany ?? e.tracking?.shippingCompany ?? "",
          estimatedArrival: tracking.estimatedArrival ?? e.tracking?.estimatedArrival ?? "",
          currentStatus: tracking.currentStatus ?? e.tracking?.currentStatus ?? "",
        };
        return {
          ...e,
          tracking: next,
          updatedAt: new Date().toISOString(),
          timeline: [...e.timeline, tev("tracking_updated", `تحديث الشحنة: ${next.currentStatus}`, esc.agencyName)],
        };
      });
      notify("user", { title: "تحديث الشحن", message: `تحديث حالة شحنة ${id}`, category: "escrow", relatedEntityType: "escrow", relatedEntityId: id, actionUrl: "/user/escrow", priority: "medium" });
    },
  });
};

export const useMarkDelivered = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => { await delay(500); return { id }; },
    onSuccess: ({ id }) => {
      const esc = (qc.getQueryData<Escrow[]>(EK) ?? []).find((e) => e.id === id);
      if (!esc) return;
      patchEscrow(qc, id, (e) => ({
        ...e,
        status: "awaiting_confirmation",
        tracking: e.tracking ? { ...e.tracking, currentStatus: "تم التسليم" } : e.tracking,
        updatedAt: new Date().toISOString(),
        timeline: [...e.timeline, tev("vehicle_delivered", "تم تسليم السيارة إلى موقع الاستلام", esc.agencyName)],
      }));
      notify("user", { title: "وصلت سيارتك", message: `تم تسليم السيارة — يرجى تأكيد الاستلام لإتمام الصفقة`, category: "escrow", relatedEntityType: "escrow", relatedEntityId: id, actionUrl: "/user/escrow", priority: "high" });
      notify("admin", { title: "تسليم سيارة", message: `تم تسليم سيارة الضمان ${id}`, category: "escrow", relatedEntityType: "escrow", relatedEntityId: id, actionUrl: "/admin/escrow", priority: "low" });
    },
  });
};

export const useUploadEscrowDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, kind, name }: { id: string; kind: EscrowDocumentKind; name: string }) => { await delay(400); return { id, kind, name }; },
    onSuccess: ({ id, kind, name }) => {
      const auth = useAuthStore.getState();
      const doc: EscrowDocument = { id: uid("doc"), kind, name, uploadedBy: auth.name, uploadedAt: new Date().toISOString() };
      patchEscrow(qc, id, (e) => ({
        ...e,
        documents: [...e.documents, doc],
        updatedAt: new Date().toISOString(),
        timeline: [...e.timeline, tev("document_uploaded", `تم رفع ملف (${name})`, auth.name)],
      }));
      notify("user", { title: "مستند جديد", message: `تم رفع ${name} على ضمان ${id}`, category: "escrow", relatedEntityType: "escrow", relatedEntityId: id, actionUrl: "/user/escrow", priority: "low" });
    },
  });
};

export const useAddEscrowNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => { await delay(250); return { id, note }; },
    onSuccess: ({ id, note }) => {
      const auth = useAuthStore.getState();
      patchEscrow(qc, id, (e) => ({
        ...e,
        notes: `${e.notes}${e.notes ? "\n" : ""}${note}`,
        updatedAt: new Date().toISOString(),
        timeline: [...e.timeline, tev("note", note, auth.name)],
      }));
    },
  });
};

// ================= Admin mutations =================

export const useForceReleaseEscrow = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => { await delay(600); return { id, reason }; },
    onSuccess: ({ id, reason }) => {
      const esc = (qc.getQueryData<Escrow[]>(EK) ?? []).find((e) => e.id === id);
      if (!esc) return;
      patchEscrow(qc, id, (e) => ({
        ...e,
        status: "released",
        updatedAt: new Date().toISOString(),
        timeline: [
          ...e.timeline,
          tev("admin_action", `إفراج إجباري من الإدارة${reason ? ` — ${reason}` : ""}`, "الإدارة"),
          tev("funds_released", `تم الإفراج عن ${(e.amount + e.shippingCost).toLocaleString("ar-EG")} ج.م للمعرض`, "النظام"),
        ],
      }));
      notify("agency", { title: "إفراج إجباري", message: `تم إفراج ضمان ${id} من الإدارة`, category: "escrow", relatedEntityType: "escrow", relatedEntityId: id, actionUrl: "/agency/escrow", priority: "high" });
      notify("user", { title: "قرار الإدارة", message: `تم إفراج ضمان ${id} لصالح المعرض${reason ? ` — ${reason}` : ""}`, category: "escrow", relatedEntityType: "escrow", relatedEntityId: id, actionUrl: "/user/escrow", priority: "high" });
    },
  });
};

export const useForceRefundEscrow = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => { await delay(600); return { id, reason }; },
    onSuccess: ({ id, reason }) => {
      const esc = (qc.getQueryData<Escrow[]>(EK) ?? []).find((e) => e.id === id);
      if (!esc) return;
      const total = esc.amount + esc.shippingCost;
      if (esc.paymentMethod === "wallet") {
        walletCredit(qc, total, id, "escrow_release", `استرداد ضمان — ${id}`);
      }
      patchEscrow(qc, id, (e) => ({
        ...e,
        status: "refunded",
        dispute: e.dispute ? { ...e.dispute, status: "resolved", resolution: reason ?? "قبول الاسترداد", updatedAt: new Date().toISOString() } : e.dispute,
        updatedAt: new Date().toISOString(),
        timeline: [
          ...e.timeline,
          tev("admin_action", `استرداد إجباري من الإدارة${reason ? ` — ${reason}` : ""}`, "الإدارة"),
          tev("refund_approved", `تم استرداد ${total.toLocaleString("ar-EG")} ج.م للمشتري`, "النظام"),
        ],
      }));
      notify("user", { title: "تمت الموافقة على الاسترداد", message: `تم استرداد ${total.toLocaleString("ar-EG")} ج.م لضمان ${id}`, category: "escrow", relatedEntityType: "escrow", relatedEntityId: id, actionUrl: "/user/escrow", priority: "high" });
      notify("agency", { title: "استرداد ضمان", message: `تم استرداد ضمان ${id}`, category: "escrow", relatedEntityType: "escrow", relatedEntityId: id, actionUrl: "/agency/escrow", priority: "high" });
    },
  });
};

export const useResolveDispute = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, resolution }: { id: string; status: DisputeStatus; resolution?: string }) => { await delay(500); return { id, status, resolution }; },
    onSuccess: ({ id, status, resolution }) => {
      const esc = (qc.getQueryData<Escrow[]>(EK) ?? []).find((e) => e.id === id);
      if (!esc?.dispute) return;
      patchEscrow(qc, id, (e) => ({
        ...e,
        dispute: e.dispute ? { ...e.dispute, status, resolution, updatedAt: new Date().toISOString() } : e.dispute,
        updatedAt: new Date().toISOString(),
        timeline: [...e.timeline, tev(status === "resolved" ? "dispute_resolved" : status === "rejected" ? "dispute_rejected" : "dispute_updated", `تحديث النزاع: ${status}${resolution ? ` — ${resolution}` : ""}`, "الإدارة")],
      }));
      const title = status === "resolved" ? "تم حل النزاع" : status === "rejected" ? "تم رفض النزاع" : "تحديث النزاع";
      notify("user", { title, message: `النزاع ${id}${resolution ? ` — ${resolution}` : ""}`, category: "escrow", relatedEntityType: "dispute", relatedEntityId: id, actionUrl: "/user/escrow", priority: "high" });
      notify("agency", { title, message: `النزاع على الضمان ${id}`, category: "escrow", relatedEntityType: "escrow", relatedEntityId: id, actionUrl: "/agency/escrow", priority: "high" });
    },
  });
};

// Legacy status-setter kept for compatibility with any existing caller.
export const useUpdateEscrowStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: EscrowStatus | "released" | "refunded" | "disputed" | "holding"; reason?: string }) => {
      await delay(400);
      return { id, status, reason };
    },
    onSuccess: ({ id, status, reason }) => {
      // map legacy statuses
      const map: Record<string, EscrowStatus> = { holding: "pending_payment", released: "released", refunded: "refunded", disputed: "disputed" };
      const next: EscrowStatus = (map[status as string] ?? (status as EscrowStatus));
      patchEscrow(qc, id, (e) => ({
        ...e,
        status: next,
        reason: reason ?? e.reason,
        updatedAt: new Date().toISOString(),
        timeline: [...e.timeline, tev("admin_action", `تحديث الحالة إلى ${next}${reason ? ` — ${reason}` : ""}`, "الإدارة")],
      }));
    },
  });
};
