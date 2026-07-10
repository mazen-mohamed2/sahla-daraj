import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as mock from "../services/mock-data";
import { notify } from "@/store/notifications";
import { audit } from "@/store/audit";

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));


export const useKPIs = () =>
  useQuery({ queryKey: ["kpis"], queryFn: async () => { await delay(); return mock.mockKPI; } });

export const useRevenue = () =>
  useQuery({ queryKey: ["revenue"], queryFn: async () => { await delay(); return mock.mockRevenue; } });

export const useUsers = () =>
  useQuery({ queryKey: ["users"], queryFn: async () => { await delay(); return mock.mockUsers; } });

export const useListings = () =>
  useQuery({ queryKey: ["listings"], queryFn: async () => { await delay(); return mock.mockListings; } });

export const usePendingListings = () =>
  useQuery({ queryKey: ["listings", "pending"], queryFn: async () => { await delay(); return mock.mockPendingListings; } });

export const useTransactions = () =>
  useQuery({ queryKey: ["transactions"], queryFn: async () => { await delay(); return mock.mockTransactions; } });

export const useDisputes = () =>
  useQuery({ queryKey: ["disputes"], queryFn: async () => { await delay(); return mock.mockDisputes; } });

export const useAgencyApplications = () =>
  useQuery({ queryKey: ["agency-apps"], queryFn: async () => { await delay(); return mock.mockAgencyApplications; } });

export const useWithdrawals = () =>
  useQuery({ queryKey: ["withdrawals"], queryFn: async () => { await delay(); return mock.mockWithdrawals; } });

export const useConversations = () =>
  useQuery({ queryKey: ["conversations"], queryFn: async () => { await delay(); return mock.mockConversations; } });

export const useMessages = (id?: string) =>
  useQuery({ queryKey: ["messages", id], queryFn: async () => { await delay(); return mock.mockMessages; }, enabled: !!id });

export const useImportRequests = () =>
  useQuery({ queryKey: ["import-requests"], queryFn: async () => { await delay(); return mock.mockImportRequests; } });

export { useEscrows, useEscrow, useUpdateEscrowStatus } from "./escrows";

export const useWalletTx = () =>
  useQuery({ queryKey: ["wallet-tx"], queryFn: async () => { await delay(); return mock.mockWalletTx; } });

type User = (typeof mock.mockUsers)[number];
type Listing = (typeof mock.mockListings)[number];
type Dispute = (typeof mock.mockDisputes)[number];
type Withdrawal = (typeof mock.mockWithdrawals)[number];
type Agency = (typeof mock.mockAgencyApplications)[number];


export const useUpdateUserStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, verified }: { id: string; status?: string; verified?: boolean }) => {
      await delay(500);
      return { id, status, verified };
    },
    onSuccess: (result) => {
      qc.setQueryData<User[]>(["users"], (old) =>
        old?.map((u) => (u.id === result.id ? { ...u, ...(result.status ? { status: result.status as User["status"] } : {}), ...(result.verified !== undefined ? { verified: result.verified } : {}) } : u)),
      );
      if (result.status === "banned") {
        notify("admin", { title: "تم حظر مستخدم", message: `تم حظر المستخدم ${result.id}`, category: "account", relatedEntityType: "user", relatedEntityId: result.id, actionUrl: "/admin/users", priority: "medium" });
        audit({ action: "ban_user", entity: "user", entityId: result.id });
      } else if (result.status === "active") {
        audit({ action: "unban_user", entity: "user", entityId: result.id });
      }
      if (result.verified) {
        notify("admin", { title: "تم توثيق مستخدم", message: `تم توثيق المستخدم ${result.id}`, category: "account", relatedEntityType: "user", relatedEntityId: result.id, actionUrl: "/admin/users", priority: "low" });
        notify("user", { title: "تم توثيق حسابك", message: "تمت الموافقة على طلب التوثيق (KYC)", category: "account", relatedEntityType: "kyc", actionUrl: "/user/profile", priority: "high" });
        audit({ action: "verify_user", entity: "user", entityId: result.id });
      }
    },
  });
};

export const useAddUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (user: Omit<User, "id" | "joinedAt" | "verified"> & { verified?: boolean }) => {
      await delay(600);
      return { ...user, id: `U-${Date.now()}`, joinedAt: new Date().toISOString(), verified: user.verified ?? false } as User;
    },
    onSuccess: (newUser) => {
      qc.setQueryData<User[]>(["users"], (old) => [newUser, ...(old ?? [])]);
    },
  });
};

export const useUpdateDisputeStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: string; note?: string }) => {
      await delay(400);
      return { id, status, note };
    },
    onSuccess: (result) => {
      qc.setQueryData<Dispute[]>(["disputes"], (old) =>
        old?.map((d) => (d.id === result.id ? { ...d, status: result.status as Dispute["status"], note: result.note ?? d.note } : d)),
      );
      if (result.status === "resolved" || result.status === "rejected") {
        notify("user", { title: result.status === "resolved" ? "تم حل النزاع" : "تم رفض النزاع", message: `النزاع ${result.id}${result.note ? ` — ${result.note}` : ""}`, category: "escrow", relatedEntityType: "dispute", relatedEntityId: result.id, actionUrl: "/user/escrow", priority: "high" });
        audit({ action: result.status === "resolved" ? "resolve_dispute" : "reject_dispute", entity: "dispute", entityId: result.id, meta: result.note });
      } else if (result.status === "escalated") {
        audit({ action: "escalate_dispute", entity: "dispute", entityId: result.id, meta: result.note });
      }
    },
  });
};

export const useUpdateWithdrawalStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await delay(400);
      return { id, status };
    },
    onSuccess: (result) => {
      qc.setQueryData<Withdrawal[]>(["withdrawals"], (old) =>
        old?.map((w) => (w.id === result.id ? { ...w, status: result.status as Withdrawal["status"] } : w)),
      );
      const title = result.status === "approved" ? "تمت الموافقة على سحبك" : result.status === "rejected" ? "تم رفض طلب السحب" : "تم تحديث طلب السحب";
      notify("user", { title, message: `طلب السحب ${result.id}`, category: "wallet", relatedEntityType: "withdrawal", relatedEntityId: result.id, actionUrl: "/user/wallet", priority: "high" });
      audit({ action: `withdrawal_${result.status}`, entity: "withdrawal", entityId: result.id });
    },
  });
};

export const useUpdateAgencyStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      await delay(400);
      return { id, status, reason };
    },
    onSuccess: (result) => {
      qc.setQueryData<Agency[]>(["agency-apps"], (old) =>
        old?.map((a) => (a.id === result.id ? { ...a, status: result.status as Agency["status"] } : a)),
      );
      const approved = result.status === "approved";
      notify("agency", { title: approved ? "تمت الموافقة على معرضك" : "تم رفض طلب اعتماد المعرض", message: approved ? "أصبح بإمكانك النشر الآن" : (result.reason ?? "يرجى مراجعة الشروط"), category: "account", relatedEntityType: "agency", relatedEntityId: result.id, actionUrl: "/agency", priority: "high" });
      notify("admin", { title: approved ? "تم اعتماد معرض" : "تم رفض معرض", message: `المعرض ${result.id}`, category: "account", relatedEntityType: "agency", relatedEntityId: result.id, actionUrl: "/admin/agencies", priority: "low" });
      audit({ action: approved ? "approve_agency" : "reject_agency", entity: "agency", entityId: result.id, meta: result.reason });
    },
  });
};

export const useAddAgency = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: Omit<Agency, "id" | "submittedAt" | "status">) => {
      await delay(500);
      return { ...a, id: `A-${Date.now()}`, submittedAt: new Date().toISOString(), status: "pending" as const } as Agency;
    },
    onSuccess: (n) => {
      qc.setQueryData<Agency[]>(["agency-apps"], (old) => [n, ...(old ?? [])]);
      notify("admin", { title: "طلب اعتماد معرض جديد", message: `معرض ${n.name ?? n.id} قدم طلب اعتماد`, category: "account", relatedEntityType: "agency", relatedEntityId: n.id, actionUrl: "/admin/agencies", priority: "high" });
    },
  });
};


export const useAddListing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (listing: Partial<Listing>) => {
      await delay(600);
      return {
        id: `L-${Date.now()}`,
        title: listing.title ?? "سيارة جديدة",
        make: listing.make ?? "",
        model: listing.model ?? "",
        year: listing.year ?? new Date().getFullYear(),
        price: listing.price ?? 0,
        city: listing.city ?? "القاهرة",
        seller: listing.seller ?? "أنا",
        status: listing.status ?? "pending",
        views: 0,
        createdAt: new Date().toISOString(),
        image: listing.image ?? "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400",
      } as Listing;
    },
    onSuccess: (n) => {
      qc.setQueryData<Listing[]>(["listings"], (old) => [n, ...(old ?? [])]);
    },
  });
};

export const useDeleteListing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await delay(300); return id; },
    onSuccess: (id) => {
      qc.setQueryData<Listing[]>(["listings"], (old) => old?.filter((l) => l.id !== id));
    },
  });
};

export const useUpdateListing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Listing> & { id: string }) => {
      await delay(400);
      return { id, ...data };
    },
    onSuccess: (result) => {
      qc.setQueryData<Listing[]>(["listings"], (old) =>
        old?.map((l) => (l.id === result.id ? { ...l, ...result } as Listing : l)),
      );
    },
  });
};

export const useUpdateListingStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await delay(400);
      return { id, status };
    },
    onSuccess: (result) => {
      qc.setQueryData<Listing[]>(["listings"], (old) =>
        old?.map((l) => (l.id === result.id ? { ...l, status: result.status as Listing["status"] } : l)),
      );
      qc.setQueryData<Listing[]>(["listings", "pending"], (old) => old?.filter((l) => l.id !== result.id));
      const approved = result.status === "active" || result.status === "approved";
      const title = approved ? "تم قبول إعلانك" : result.status === "rejected" ? "تم رفض إعلانك" : "تم تحديث حالة الإعلان";
      // notify both user and agency feeds; sidebar shows per active role
      for (const r of ["user", "agency"] as const) {
        notify(r, { title, message: `الإعلان ${result.id}`, category: "listings", relatedEntityType: "listing", relatedEntityId: result.id, actionUrl: `/${r}/listings`, priority: "medium" });
      }
    },
  });
};

export const usePurchaseTokens = () =>
  useMutation({
    mutationFn: async (amount: number) => {
      await delay(700);
      return { amount, transactionId: `TK-${Date.now()}` };
    },
  });

export const useSubmitBid = () =>
  useMutation({
    mutationFn: async (bid: { requestId: string; amount: number; notes: string; tokenCost: number; delivery?: string; warranty?: string }) => {
      await delay(600);
      return bid;
    },
  });
