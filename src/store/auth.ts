import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "admin" | "agency" | "user";

interface AuthState {
  role: Role;
  name: string;
  phone: string;
  avatar: string;
  setRole: (role: Role) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      role: "admin",
      name: "أحمد المطيري",
      phone: "+966 55 123 4567",
      avatar: "أ",
      setRole: (role) => set({ role }),
    }),
    { name: "cm-auth" },
  ),
);
