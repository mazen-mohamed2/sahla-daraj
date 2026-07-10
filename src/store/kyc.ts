// KYC store (UI-only). Backend-ready: the shape mirrors what a REST endpoint
// would return; swapping to a real API requires only replacing the reducers
// with fetch calls to the same set of actions.

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type KycStatus = "not_verified" | "pending" | "verified" | "rejected";

export interface KycRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  fileName: string;
  status: KycStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

interface KycState {
  requests: KycRequest[];
  submit: (input: { userId: string; userName: string; userPhone: string; fileName: string }) => KycRequest;
  approve: (id: string, reviewer: string) => void;
  reject: (id: string, reviewer: string, reason?: string) => void;
}

const seed: KycRequest[] = [
  {
    id: "KYC-1001",
    userId: "U-1004",
    userName: "أحمد عبدالله",
    userPhone: "+20 122 555 4433",
    fileName: "national-id-1004.jpg",
    status: "pending",
    submittedAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
  },
  {
    id: "KYC-1002",
    userId: "U-1009",
    userName: "دينا فؤاد",
    userPhone: "+20 101 887 6543",
    fileName: "national-id-1009.pdf",
    status: "pending",
    submittedAt: new Date(Date.now() - 26 * 3600_000).toISOString(),
  },
];

export const useKycStore = create<KycState>()(
  persist(
    (set) => ({
      requests: seed,
      submit: ({ userId, userName, userPhone, fileName }) => {
        const req: KycRequest = {
          id: `KYC-${Date.now()}`,
          userId,
          userName,
          userPhone,
          fileName,
          status: "pending",
          submittedAt: new Date().toISOString(),
        };
        set((s) => ({
          // replace any existing not-verified/rejected/pending record for this user
          requests: [req, ...s.requests.filter((r) => r.userId !== userId)],
        }));
        return req;
      },
      approve: (id, reviewer) =>
        set((s) => ({
          requests: s.requests.map((r) =>
            r.id === id
              ? { ...r, status: "verified", reviewedAt: new Date().toISOString(), reviewedBy: reviewer, rejectionReason: undefined }
              : r,
          ),
        })),
      reject: (id, reviewer, reason) =>
        set((s) => ({
          requests: s.requests.map((r) =>
            r.id === id
              ? { ...r, status: "rejected", reviewedAt: new Date().toISOString(), reviewedBy: reviewer, rejectionReason: reason }
              : r,
          ),
        })),
    }),
    { name: "cm-kyc-store" },
  ),
);

export const KYC_STATUS_LABELS_AR: Record<KycStatus, string> = {
  not_verified: "غير موثّق",
  pending: "قيد المراجعة",
  verified: "موثّق",
  rejected: "مرفوض",
};

export const KYC_STATUS_TONE: Record<KycStatus, string> = {
  not_verified: "bg-muted text-muted-foreground border-border",
  pending: "bg-warning/15 text-warning-foreground border-warning/40",
  verified: "bg-success/15 text-success border-success/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
};
