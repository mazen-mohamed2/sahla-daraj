import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as mock from "../services/mock-data";

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
  useQuery({ queryKey: ["listings","pending"], queryFn: async () => { await delay(); return mock.mockPendingListings; } });

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

export const useEscrows = () =>
  useQuery({ queryKey: ["escrows"], queryFn: async () => { await delay(); return mock.mockEscrows; } });

export const useWalletTx = () =>
  useQuery({ queryKey: ["wallet-tx"], queryFn: async () => { await delay(); return mock.mockWalletTx; } });

export const useApproveMutation = (kind: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await delay(600); return { id, ok: true }; },
    onSuccess: () => qc.invalidateQueries({ queryKey: [kind] }),
  });
};
