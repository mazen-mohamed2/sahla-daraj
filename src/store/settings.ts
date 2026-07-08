import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  notifyMessages: boolean;
  notifyEscrow: boolean;
  notifyViews: boolean;
  notifyPromotions: boolean;
  privacyPhoneVerifiedOnly: boolean;
  privacyPublicProfile: boolean;
  set: (patch: Partial<SettingsState>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      notifyMessages: true,
      notifyEscrow: true,
      notifyViews: false,
      notifyPromotions: false,
      privacyPhoneVerifiedOnly: true,
      privacyPublicProfile: true,
      set: (patch) => set(patch),
    }),
    { name: "cm-settings" },
  ),
);

export const EG_CITIES = [
  "القاهرة", "الجيزة", "الإسكندرية", "الأقصر", "أسوان",
  "المنصورة", "طنطا", "الزقازيق", "الإسماعيلية", "بورسعيد",
];

export const AVATAR_COLORS = ["#2563eb", "#16a34a", "#dc2626", "#9333ea", "#ea580c", "#0891b2"];
