import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "admin" | "agency" | "user";

export interface Profile {
  name: string;
  phone: string;
  email: string;
  city: string;
  bio: string;
  avatar: string;
  avatarColor: string;
}

interface AuthState extends Profile {
  role: Role;
  isLoggedIn: boolean;
  setRole: (role: Role) => void;
  login: (role: Role, phone?: string) => void;
  logout: () => void;
  updateProfile: (p: Partial<Profile>) => void;
}

const defaults: Profile = {
  name: "محمد سعيد",
  phone: "+20 100 123 4567",
  email: "mohamed@example.com",
  city: "القاهرة",
  bio: "",
  avatar: "م",
  avatarColor: "#2563eb",
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...defaults,
      role: "admin",
      isLoggedIn: false,
      setRole: (role) => set({ role }),
      login: (role, phone) =>
        set({
          role,
          isLoggedIn: true,
          phone: phone ?? defaults.phone,
          name: role === "admin" ? "أحمد المطيري" : role === "agency" ? "معرض النخبة" : defaults.name,
          avatar: role === "admin" ? "أ" : role === "agency" ? "م" : "م",
        }),
      logout: () => set({ isLoggedIn: false }),
      updateProfile: (p) => set((s) => ({ ...s, ...p, avatar: (p.name ?? s.name).charAt(0) })),
    }),
    { name: "cm-auth" },
  ),
);
