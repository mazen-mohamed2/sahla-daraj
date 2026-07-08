import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NotificationType = "escrow" | "message" | "dispute" | "system";
export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const seed: AppNotification[] = [
  { id: "n1", type: "escrow", title: "تم الإفراج عن مبلغ الضمان", body: "تم تحويل 320,000 ج.م لحسابك", time: "منذ 5 دقائق", read: false },
  { id: "n2", type: "message", title: "رسالة جديدة من أحمد عبدالله", body: "هل السيارة لا زالت متوفرة؟", time: "منذ 12 دقيقة", read: false },
  { id: "n3", type: "dispute", title: "تم فتح نزاع على صفقة", body: "طلب المشتري فتح نزاع — بانتظار مراجعتك", time: "منذ ساعة", read: false },
  { id: "n4", type: "system", title: "تم قبول إعلانك", body: "تويوتا كورولا 2021 — نشط الآن", time: "منذ 3 ساعات", read: true },
  { id: "n5", type: "escrow", title: "مبلغ ضمان جديد", body: "تم حجز 180,000 ج.م لإعلانك", time: "أمس", read: true },
];

interface State {
  items: AppNotification[];
  markAllRead: () => void;
  markRead: (id: string) => void;
  add: (n: Omit<AppNotification, "id" | "read" | "time">) => void;
}

export const useNotifications = create<State>()(
  persist(
    (set) => ({
      items: seed,
      markAllRead: () => set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })) })),
      markRead: (id) => set((s) => ({ items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      add: (n) =>
        set((s) => ({
          items: [{ ...n, id: `n-${Date.now()}`, read: false, time: "الآن" }, ...s.items],
        })),
    }),
    { name: "cm-notifications" },
  ),
);
