import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "@/lib/i18n";
import type { Currency } from "@/lib/format";

interface UIState {
  theme: "light" | "dark";
  sidebarOpen: boolean;
  lang: Lang;
  currency: Currency;
  toggleTheme: () => void;
  toggleLang: () => void;
  setLang: (l: Lang) => void;
  setCurrency: (c: Currency) => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: "light",
      sidebarOpen: true,
      lang: "ar",
      currency: "EGP",
      toggleTheme: () =>
        set((s) => {
          const next = s.theme === "light" ? "dark" : "light";
          if (typeof document !== "undefined") {
            document.documentElement.classList.toggle("dark", next === "dark");
          }
          return { theme: next };
        }),
      toggleLang: () =>
        set((s) => {
          const next: Lang = s.lang === "ar" ? "en" : "ar";
          if (typeof document !== "undefined") {
            document.documentElement.setAttribute("dir", next === "ar" ? "rtl" : "ltr");
            document.documentElement.setAttribute("lang", next);
          }
          return { lang: next };
        }),
      setLang: (lang) => set({ lang }),
      setCurrency: (currency) => set({ currency }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    }),
    { name: "cm-ui" },
  ),
);
