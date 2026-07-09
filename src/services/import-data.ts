// Import Request Marketplace — types, seeds, helpers.
// All data is client-side; mutations mutate query cache directly.

export type ImportStatus =
  | "draft"
  | "open"
  | "bidding"
  | "accepted"
  | "closed"
  | "cancelled"
  | "flagged"
  | "hidden";

export type OfferStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export interface TimelineEvent {
  id: string;
  type:
    | "created"
    | "updated"
    | "offer_received"
    | "offer_accepted"
    | "offer_rejected"
    | "offer_withdrawn"
    | "cancelled"
    | "closed"
    | "reopened"
    | "flagged"
    | "hidden"
    | "escrow_created"
    | "admin_note";
  message: string;
  at: string;
  actor?: string;
}

export interface ImportRequest {
  id: string;
  requesterId: string;
  requester: string;
  // vehicle
  brand: string;
  model: string;
  year: number;
  condition: "new" | "used" | "any";
  mileage: number;
  fuel: "بنزين" | "ديزل" | "هجين" | "كهربائي";
  transmission: "أوتوماتيك" | "مانيوال";
  // requirements
  budget: number;
  color: string;
  notes: string;
  // shipping
  destination: string;
  deliveryPreference: "urgent" | "standard" | "flexible";
  // meta
  fromCountry?: string;
  status: ImportStatus;
  createdAt: string;
  updatedAt: string;
  deadline: string;
  timeline: TimelineEvent[];
  adminNotes: string;
  acceptedOfferId?: string;
  escrowId?: string;
  flagReason?: string;
  hidden?: boolean;
  reported?: boolean;
  reportReason?: string;

}

export interface Offer {
  id: string;
  requestId: string;
  agencyId: string;
  agencyName: string;
  agencyRating: number;
  completedDeals: number;
  price: number;
  shippingCost: number;
  delivery: string;
  warranty: string;
  notes: string;
  status: OfferStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  targetType: "import_request" | "offer";
  targetId: string;
  at: string;
  meta?: string;
}

const brands = [
  { brand: "تويوتا", model: "لاند كروزر" },
  { brand: "بي إم دبليو", model: "X5" },
  { brand: "مرسيدس", model: "GLC 300" },
  { brand: "لكزس", model: "RX 350" },
  { brand: "هوندا", model: "أكورد" },
  { brand: "أودي", model: "Q7" },
  { brand: "بورش", model: "Cayenne" },
  { brand: "نيسان", model: "باترول" },
];

const requesters = [
  { id: "U-2001", name: "محمد سعيد" },
  { id: "U-2002", name: "أحمد عبدالله" },
  { id: "U-2003", name: "سارة إبراهيم" },
  { id: "U-2004", name: "خالد عمر" },
  { id: "U-2005", name: "يوسف حمدي" },
];

const cities = ["القاهرة", "الجيزة", "الإسكندرية", "المنصورة", "الأقصر"];
const countries = ["اليابان", "ألمانيا", "الولايات المتحدة", "كوريا", "الإمارات"];

function iso(dOffsetDays = 0) {
  return new Date(Date.now() - dOffsetDays * 86_400_000).toISOString();
}

export function seedImportRequests(): ImportRequest[] {
  return Array.from({ length: 8 }).map((_, i) => {
    const b = brands[i % brands.length];
    const r = requesters[i % requesters.length];
    const status: ImportStatus =
      i === 0 ? "open" : i === 1 ? "bidding" : i === 2 ? "accepted" : i === 3 ? "cancelled" : i % 2 === 0 ? "open" : "bidding";
    const created = iso(i + 1);
    return {
      id: `IR-${3000 + i}`,
      requesterId: r.id,
      requester: r.name,
      brand: b.brand,
      model: b.model,
      year: 2021 + (i % 5),
      condition: i % 3 === 0 ? "new" : "used",
      mileage: 10000 + i * 12000,
      fuel: "بنزين",
      transmission: "أوتوماتيك",
      budget: 800_000 + i * 175_000,
      color: ["أبيض لؤلؤي", "أسود", "فضي", "رمادي", "أزرق كحلي"][i % 5],
      notes: "أفضل مواصفات الفل كامل مع كاميرا 360 وفتحة سقف.",
      destination: cities[i % cities.length],
      deliveryPreference: (["urgent", "standard", "flexible"] as const)[i % 3],
      fromCountry: countries[i % countries.length],
      status,
      createdAt: created,
      updatedAt: created,
      deadline: iso(-(14 - i)),
      timeline: [
        { id: `t-${i}-1`, type: "created", message: "تم إنشاء الطلب", at: created, actor: r.name },
      ],
      adminNotes: "",
    };
  });
}

const agencies = [
  { id: "AG-501", name: "معرض النخبة", rating: 4.8, deals: 74 },
  { id: "AG-502", name: "الأهرام موتورز", rating: 4.6, deals: 51 },
  { id: "AG-503", name: "درة النيل", rating: 4.9, deals: 128 },
  { id: "AG-504", name: "العالمية موتورز", rating: 4.4, deals: 33 },
];

export function seedOffers(requests: ImportRequest[]): Offer[] {
  const offers: Offer[] = [];
  requests.forEach((r, i) => {
    if (r.status === "cancelled" || r.status === "closed") return;
    const count = r.status === "bidding" ? 4 : r.status === "accepted" ? 3 : (i % 3) + 1;
    for (let k = 0; k < count; k++) {
      const a = agencies[(i + k) % agencies.length];
      const price = r.budget - 30_000 + k * 25_000;
      offers.push({
        id: `OF-${8000 + i * 10 + k}`,
        requestId: r.id,
        agencyId: a.id,
        agencyName: a.name,
        agencyRating: a.rating,
        completedDeals: a.deals,
        price,
        shippingCost: 45_000 + k * 5_000,
        delivery: ["أسبوعين", "شهر", "شهرين", "3 أشهر"][k % 4],
        warranty: ["سنة", "سنتين", "6 أشهر", "بدون ضمان"][k % 4],
        notes: "شحن سريع، تأمين شامل خلال النقل.",
        status: r.status === "accepted" && k === 0 ? "accepted" : r.status === "accepted" ? "rejected" : "pending",
        createdAt: iso(Math.max(0, i - k)),
        updatedAt: iso(Math.max(0, i - k)),
      });
    }
  });
  return offers;
}

export function seedAuditLog(): AuditLog[] {
  return [];
}

export const STATUS_LABELS_AR: Record<ImportStatus, string> = {
  draft: "مسودة",
  open: "مفتوح",
  bidding: "عروض جارية",
  accepted: "تم القبول",
  closed: "مغلق",
  cancelled: "ملغي",
  flagged: "مبلغ عنه",
  hidden: "مخفي",
};

export const STATUS_VARIANTS: Record<ImportStatus, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  open: "default",
  bidding: "secondary",
  accepted: "default",
  closed: "outline",
  cancelled: "destructive",
  flagged: "destructive",
  hidden: "outline",
};

export const OFFER_STATUS_LABELS_AR: Record<OfferStatus, string> = {
  pending: "قيد المراجعة",
  accepted: "مقبول",
  rejected: "مرفوض",
  withdrawn: "تم السحب",
};

export const CONDITION_LABELS: Record<ImportRequest["condition"], string> = {
  new: "جديد",
  used: "مستعمل",
  any: "أي حالة",
};

export const DELIVERY_PREF_LABELS: Record<ImportRequest["deliveryPreference"], string> = {
  urgent: "عاجل",
  standard: "قياسي",
  flexible: "مرن",
};

export const BRANDS = brands.map((b) => b.brand);
export const CITIES = cities;
export const COUNTRIES = countries;
