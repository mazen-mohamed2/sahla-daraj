// Escrow domain — types, seeds, helpers.
// All state is client-side; mutations mutate the query cache directly.

export type EscrowStatus =
  | "pending_payment"
  | "paid"
  | "purchased"
  | "shipping"
  | "delivered"
  | "awaiting_confirmation"
  | "released"
  | "refunded"
  | "disputed";

export type EscrowTimelineType =
  | "created"
  | "payment_completed"
  | "purchase_confirmed"
  | "shipping_started"
  | "tracking_updated"
  | "vehicle_delivered"
  | "buyer_confirmed"
  | "funds_released"
  | "refund_approved"
  | "refund_rejected"
  | "dispute_opened"
  | "dispute_updated"
  | "dispute_resolved"
  | "dispute_rejected"
  | "document_uploaded"
  | "note"
  | "admin_action";

export interface EscrowTimelineEvent {
  id: string;
  type: EscrowTimelineType;
  message: string;
  at: string;
  actor?: string;
}

export type EscrowDocumentKind =
  | "invoice"
  | "shipping_receipt"
  | "vehicle_docs"
  | "inspection";

export interface EscrowDocument {
  id: string;
  kind: EscrowDocumentKind;
  name: string;
  uploadedBy: string;
  uploadedAt: string;
}

export type EscrowPaymentMethod = "wallet" | "bank" | "instapay" | "card";

export interface EscrowTracking {
  trackingNumber: string;
  shippingCompany: string;
  estimatedArrival: string;
  currentStatus: string;
}

export type DisputeStatus = "open" | "under_review" | "resolved" | "rejected";

export interface EscrowDispute {
  id: string;
  openedBy: string;
  reason: string;
  description: string;
  attachmentName?: string;
  status: DisputeStatus;
  createdAt: string;
  updatedAt: string;
  resolution?: string;
}

export interface Escrow {
  id: string;
  requestId?: string;
  offerId?: string;
  buyerId: string;
  buyerName: string;
  agencyId: string;
  agencyName: string;
  vehicle: string;
  amount: number;
  commission: number;
  shippingCost: number;
  paymentMethod?: EscrowPaymentMethod;
  status: EscrowStatus;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  notes: string;
  timeline: EscrowTimelineEvent[];
  documents: EscrowDocument[];
  tracking?: EscrowTracking;
  dispute?: EscrowDispute;
  // legacy compatibility fields (existing consumers read these)
  listing: string;
  counterparty: string;
  reason?: string;
}

export const ESCROW_STATUS_LABELS_AR: Record<EscrowStatus, string> = {
  pending_payment: "بانتظار الدفع",
  paid: "تم الدفع",
  purchased: "تم شراء السيارة",
  shipping: "قيد الشحن",
  delivered: "تم التسليم",
  awaiting_confirmation: "بانتظار تأكيد المشتري",
  released: "تم الإفراج",
  refunded: "مسترد",
  disputed: "متنازع عليه",
};

export const ESCROW_STATUS_TONE: Record<EscrowStatus, string> = {
  pending_payment: "bg-warning/15 text-warning-foreground border-warning/40",
  paid: "bg-primary/15 text-primary border-primary/30",
  purchased: "bg-primary/15 text-primary border-primary/30",
  shipping: "bg-primary/15 text-primary border-primary/30",
  delivered: "bg-primary/15 text-primary border-primary/30",
  awaiting_confirmation: "bg-warning/15 text-warning-foreground border-warning/40",
  released: "bg-success/15 text-success border-success/30",
  refunded: "bg-muted text-muted-foreground border-border",
  disputed: "bg-destructive/15 text-destructive border-destructive/30",
};

export const DOC_KIND_LABELS_AR: Record<EscrowDocumentKind, string> = {
  invoice: "فاتورة",
  shipping_receipt: "إيصال شحن",
  vehicle_docs: "أوراق السيارة",
  inspection: "تقرير الفحص",
};

export const DISPUTE_STATUS_LABELS_AR: Record<DisputeStatus, string> = {
  open: "مفتوح",
  under_review: "قيد المراجعة",
  resolved: "تم الحل",
  rejected: "مرفوض",
};

// Ordered pipeline used by the timeline visual.
export const ESCROW_PIPELINE: EscrowStatus[] = [
  "pending_payment",
  "paid",
  "purchased",
  "shipping",
  "delivered",
  "awaiting_confirmation",
  "released",
];

const iso = (offsetDays = 0) => new Date(Date.now() - offsetDays * 86_400_000).toISOString();
const uid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

function seedEvent(type: EscrowTimelineType, message: string, offsetDays = 0, actor?: string): EscrowTimelineEvent {
  return { id: uid("tev"), type, message, at: iso(offsetDays), actor };
}

export function seedEscrows(buyerId: string, buyerName: string): Escrow[] {
  const rows: Array<Partial<Escrow> & Pick<Escrow, "id" | "status" | "vehicle" | "agencyName" | "amount">> = [
    { id: "ES-2044", status: "pending_payment", vehicle: "تويوتا كورولا 2023", agencyName: "معرض النخبة", amount: 480_000, commission: 12_000, shippingCost: 25_000 },
    { id: "ES-2039", status: "shipping", vehicle: "هيونداي إلنترا 2022", agencyName: "الأهرام موتورز", amount: 395_000, commission: 9_500, shippingCost: 20_000 },
    { id: "ES-2033", status: "awaiting_confirmation", vehicle: "كيا سيراتو 2022", agencyName: "درة النيل", amount: 340_000, commission: 8_000, shippingCost: 18_000 },
    { id: "ES-2028", status: "released", vehicle: "نيسان صني 2021", agencyName: "العالمية موتورز", amount: 285_000, commission: 6_500, shippingCost: 15_000 },
    { id: "ES-2021", status: "disputed", vehicle: "شفروليه أوبترا 2020", agencyName: "السعد للسيارات", amount: 220_000, commission: 5_500, shippingCost: 14_000 },
    { id: "ES-2015", status: "refunded", vehicle: "MG 5 2022", agencyName: "معرض الديار", amount: 305_000, commission: 7_000, shippingCost: 16_000 },
  ];
  return rows.map((r, i) => {
    const commission = r.commission ?? Math.round((r.amount ?? 0) * 0.025);
    const shippingCost = r.shippingCost ?? 15_000;
    const status = r.status;
    const timeline: EscrowTimelineEvent[] = [seedEvent("created", "تم إنشاء الضمان", 12 + i)];
    if (status !== "pending_payment") timeline.push(seedEvent("payment_completed", "تم استلام الدفع من المشتري", 10 + i, buyerName));
    if (["purchased", "shipping", "delivered", "awaiting_confirmation", "released", "disputed"].includes(status)) {
      timeline.push(seedEvent("purchase_confirmed", "أكد المعرض شراء السيارة", 8 + i, r.agencyName));
    }
    if (["shipping", "delivered", "awaiting_confirmation", "released", "disputed"].includes(status)) {
      timeline.push(seedEvent("shipping_started", "بدأ الشحن", 6 + i, r.agencyName));
    }
    if (["delivered", "awaiting_confirmation", "released"].includes(status)) {
      timeline.push(seedEvent("vehicle_delivered", "تم تسليم السيارة إلى موقع الاستلام", 3 + i, r.agencyName));
    }
    if (status === "released") timeline.push(seedEvent("buyer_confirmed", "أكد المشتري الاستلام", 2 + i, buyerName));
    if (status === "released") timeline.push(seedEvent("funds_released", "تم الإفراج عن المبلغ للمعرض", 1 + i, "النظام"));
    if (status === "refunded") timeline.push(seedEvent("refund_approved", "تمت الموافقة على استرداد المبلغ", 1 + i, "الإدارة"));
    const dispute: EscrowDispute | undefined = status === "disputed"
      ? {
          id: uid("DSP"),
          openedBy: buyerName,
          reason: "عدم مطابقة الوصف",
          description: "السيارة عليها آثار حادث لم تُذكر في العرض.",
          status: "under_review",
          createdAt: iso(1 + i),
          updatedAt: iso(1 + i),
        }
      : undefined;
    if (dispute) timeline.push(seedEvent("dispute_opened", `فتح المشتري نزاعاً: ${dispute.reason}`, 1 + i, buyerName));

    const tracking: EscrowTracking | undefined = ["shipping", "delivered", "awaiting_confirmation", "released"].includes(status)
      ? {
          trackingNumber: `TRK-${100000 + i * 137}`,
          shippingCompany: ["أرامكس", "بوستا مصر", "DHL", "R2 Logistics"][i % 4],
          estimatedArrival: iso(-3 - i),
          currentStatus: status === "delivered" || status === "awaiting_confirmation" || status === "released" ? "تم التسليم" : "في الطريق",
        }
      : undefined;

    const documents: EscrowDocument[] = [];
    if (status !== "pending_payment") {
      documents.push({ id: uid("doc"), kind: "invoice", name: `invoice-${r.id}.pdf`, uploadedBy: "النظام", uploadedAt: iso(10 + i) });
    }
    if (tracking) {
      documents.push({ id: uid("doc"), kind: "shipping_receipt", name: `shipping-${r.id}.pdf`, uploadedBy: r.agencyName ?? "المعرض", uploadedAt: iso(6 + i) });
    }

    return {
      id: r.id,
      buyerId,
      buyerName,
      agencyId: `AG-${500 + i}`,
      agencyName: r.agencyName,
      vehicle: r.vehicle,
      amount: r.amount,
      commission,
      shippingCost,
      paymentMethod: status !== "pending_payment" ? (["wallet", "bank", "instapay", "card"] as EscrowPaymentMethod[])[i % 4] : undefined,
      status,
      createdAt: iso(12 + i),
      updatedAt: iso(i),
      paidAt: status !== "pending_payment" ? iso(10 + i) : undefined,
      notes: "",
      timeline,
      documents,
      tracking,
      dispute,
      listing: r.vehicle,
      counterparty: r.agencyName ?? "",
      reason: dispute?.reason,
    } as Escrow;
  });
}
