import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "./auth";

export type NotifCategory =
  | "escrow"
  | "listings"
  | "messages"
  | "import"
  | "wallet"
  | "account"
  | "system";

export type NotifPriority = "low" | "medium" | "high";

export type RelatedEntityType =
  | "escrow"
  | "listing"
  | "conversation"
  | "import_request"
  | "wallet_tx"
  | "token_tx"
  | "user"
  | "agency"
  | "dispute"
  | "withdrawal"
  | "kyc"
  | null;

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: NotifCategory;
  relatedEntityId?: string;
  relatedEntityType?: RelatedEntityType;
  createdAt: string;
  read: boolean;
  actionUrl?: string;
  actor?: string;
  priority: NotifPriority;
}

export type NotifInput = Omit<AppNotification, "id" | "createdAt" | "read"> & {
  priority?: NotifPriority;
};

type Feeds = Record<Role, AppNotification[]>;

const now = (offsetMs = 0) => new Date(Date.now() - offsetMs).toISOString();

const seed: Feeds = {
  user: [
    { id: "un-1", title: "تم الإفراج عن مبلغ الضمان", message: "تم تحويل 320,000 ج.م لحسابك من صفقة تويوتا كورولا", category: "escrow", relatedEntityType: "escrow", relatedEntityId: "ES-2044", actionUrl: "/user/escrow", createdAt: now(5 * 60_000), read: false, priority: "high" },
    { id: "un-2", title: "رسالة جديدة من أحمد عبدالله", message: "هل السيارة لا زالت متوفرة؟", category: "messages", relatedEntityType: "conversation", relatedEntityId: "c1", actionUrl: "/user/chat", createdAt: now(12 * 60_000), read: false, priority: "medium", actor: "أحمد عبدالله" },
    { id: "un-3", title: "تم قبول إعلانك", message: "تويوتا كورولا 2021 — أصبح نشطاً الآن", category: "listings", relatedEntityType: "listing", relatedEntityId: "L-1001", actionUrl: "/user/listings", createdAt: now(3 * 3600_000), read: true, priority: "medium" },
    { id: "un-4", title: "تم استلام إيداع", message: "تمت إضافة 15,000 ج.م إلى محفظتك", category: "wallet", relatedEntityType: "wallet_tx", relatedEntityId: "WT-6001", actionUrl: "/user/wallet", createdAt: now(2 * 86_400_000), read: true, priority: "low" },
  ],
  agency: [
    { id: "an-1", title: "طلب استيراد جديد", message: "طلب استيراد BMW X5 2023 من العميل محمد سعيد", category: "import", relatedEntityType: "import_request", relatedEntityId: "IR-501", actionUrl: "/agency/bids", createdAt: now(3 * 60_000), read: false, priority: "high" },
    { id: "an-2", title: "تم قبول عرضك", message: "قبل العميل عرضك بقيمة 1,850,000 ج.م", category: "import", relatedEntityType: "import_request", relatedEntityId: "IR-499", actionUrl: "/agency/bids", createdAt: now(45 * 60_000), read: false, priority: "high" },
    { id: "an-3", title: "رصيد التوكن منخفض", message: "لديك 28 توكن فقط — قم بالشحن للمتابعة", category: "wallet", relatedEntityType: "token_tx", actionUrl: "/agency/tokens", createdAt: now(6 * 3600_000), read: false, priority: "medium" },
    { id: "an-4", title: "تم قبول إعلانك", message: "مرسيدس C200 2022 أصبح منشوراً", category: "listings", relatedEntityType: "listing", relatedEntityId: "L-2201", actionUrl: "/agency/listings", createdAt: now(86_400_000), read: true, priority: "medium" },
  ],
  admin: [
    { id: "adn-1", title: "طلب اعتماد معرض جديد", message: "معرض القاهرة للسيارات المستوردة قدم طلب اعتماد", category: "account", relatedEntityType: "agency", relatedEntityId: "A-9001", actionUrl: "/admin/agencies", createdAt: now(8 * 60_000), read: false, priority: "high" },
    { id: "adn-2", title: "نزاع جديد", message: "فتح المشتري نزاعاً على صفقة ES-2044", category: "escrow", relatedEntityType: "dispute", relatedEntityId: "D-3301", actionUrl: "/admin/disputes", createdAt: now(30 * 60_000), read: false, priority: "high" },
    { id: "adn-3", title: "طلب سحب كبير", message: "طلب سحب بقيمة 250,000 ج.م بانتظار المراجعة", category: "wallet", relatedEntityType: "withdrawal", relatedEntityId: "WD-991201", actionUrl: "/admin/financial", createdAt: now(2 * 3600_000), read: false, priority: "high" },
    { id: "adn-4", title: "إعلان تم الإبلاغ عنه", message: "3 بلاغات على إعلان هوندا سيفيك 2019", category: "listings", relatedEntityType: "listing", relatedEntityId: "L-1509", actionUrl: "/admin/listings", createdAt: now(5 * 3600_000), read: true, priority: "medium" },
  ],
};

interface State {
  feeds: Feeds;
  add: (role: Role, input: NotifInput) => void;
  markRead: (role: Role, id: string) => void;
  markUnread: (role: Role, id: string) => void;
  markAllRead: (role: Role) => void;
  remove: (role: Role, id: string) => void;
  clear: (role: Role) => void;
}

export const useNotifications = create<State>()(
  persist(
    (set) => ({
      feeds: seed,
      add: (role, input) =>
        set((s) => ({
          feeds: {
            ...s.feeds,
            [role]: [
              {
                id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                createdAt: new Date().toISOString(),
                read: false,
                priority: input.priority ?? "medium",
                ...input,
              },
              ...s.feeds[role],
            ],
          },
        })),
      markRead: (role, id) =>
        set((s) => ({
          feeds: { ...s.feeds, [role]: s.feeds[role].map((n) => (n.id === id ? { ...n, read: true } : n)) },
        })),
      markUnread: (role, id) =>
        set((s) => ({
          feeds: { ...s.feeds, [role]: s.feeds[role].map((n) => (n.id === id ? { ...n, read: false } : n)) },
        })),
      markAllRead: (role) =>
        set((s) => ({
          feeds: { ...s.feeds, [role]: s.feeds[role].map((n) => ({ ...n, read: true })) },
        })),
      remove: (role, id) =>
        set((s) => ({ feeds: { ...s.feeds, [role]: s.feeds[role].filter((n) => n.id !== id) } })),
      clear: (role) => set((s) => ({ feeds: { ...s.feeds, [role]: [] } })),
    }),
    { name: "cm-notifications-v2" },
  ),
);

/** Non-hook access for use inside mutations / event handlers. */
export const notify = (role: Role, input: NotifInput) =>
  useNotifications.getState().add(role, input);

export const CATEGORY_LABELS_AR: Record<NotifCategory, string> = {
  escrow: "الضمان",
  listings: "الإعلانات",
  messages: "الرسائل",
  import: "طلبات الاستيراد",
  wallet: "المحفظة والتوكن",
  account: "الحساب",
  system: "النظام",
};

export const CATEGORY_LABELS_EN: Record<NotifCategory, string> = {
  escrow: "Escrow",
  listings: "Listings",
  messages: "Messages",
  import: "Import Requests",
  wallet: "Wallet & Tokens",
  account: "Account",
  system: "System",
};

export function formatRelative(iso: string, lang: "ar" | "en" = "ar"): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (lang === "ar") {
    if (m < 1) return "الآن";
    if (m < 60) return `منذ ${m} د`;
    if (h < 24) return `منذ ${h} س`;
    if (d < 7) return `منذ ${d} يوم`;
    return new Date(iso).toLocaleDateString("ar-EG");
  }
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US");
}
