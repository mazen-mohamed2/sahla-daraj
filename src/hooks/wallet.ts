import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useNotifications } from "@/store/notifications";
import { useAuthStore } from "@/store/auth";


export type WalletTxType = "deposit" | "withdrawal" | "escrow_hold" | "escrow_release" | "fee";
export type WalletTxStatus = "completed" | "pending" | "failed";
export type WalletMethod = "card" | "bank" | "applepay" | "googlepay" | "vodafone" | "instapay" | "fawry";

export interface WalletTx {
  id: string;
  type: WalletTxType;
  status: WalletTxStatus;
  amount: number;
  fee?: number;
  method?: WalletMethod;
  description?: string;
  reference?: string;
  escrowId?: string;
  createdAt: string;
}

export interface WalletBalance {
  available: number;
  pending: number;
  total: number;
}

const BAL_KEY = ["wallet-balance"] as const;
const TX_KEY = ["wallet-tx"] as const;

const seedTx: WalletTx[] = [
  { id: "WT-6001", type: "deposit", status: "completed", amount: 15000, method: "card", description: "إيداع عبر بطاقة بنكية", reference: "REF-441209", createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: "WT-6002", type: "escrow_hold", status: "completed", amount: 32000, description: "حجز ضمان — تويوتا كورولا 2021", escrowId: "ES-2044", reference: "REF-441210", createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: "WT-6003", type: "escrow_release", status: "completed", amount: 28000, description: "إفراج عن ضمان — هيونداي إلنترا", escrowId: "ES-2039", reference: "REF-441211", createdAt: new Date(Date.now() - 86400000 * 7).toISOString() },
  { id: "WT-6004", type: "withdrawal", status: "pending", amount: 5000, fee: 40, method: "bank", description: "طلب سحب بنكي", reference: "WD-991201", createdAt: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: "WT-6005", type: "fee", status: "completed", amount: 150, description: "رسوم خدمة", reference: "REF-441212", createdAt: new Date(Date.now() - 86400000 * 10).toISOString() },
  { id: "WT-6006", type: "deposit", status: "failed", amount: 2500, method: "vodafone", description: "محاولة إيداع فاشلة", reference: "REF-441213", createdAt: new Date(Date.now() - 86400000 * 14).toISOString() },
];

const seedBalance: WalletBalance = { available: 45300, pending: 5000, total: 50300 };

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

export const useWallet = () =>
  useQuery({
    queryKey: TX_KEY,
    queryFn: async () => { await delay(500); return seedTx; },
    staleTime: Infinity,
  });

export const useWalletBalance = () =>
  useQuery({
    queryKey: BAL_KEY,
    queryFn: async () => { await delay(400); return seedBalance; },
    staleTime: Infinity,
  });

/** Add a wallet transaction AND update balance atomically via setQueryData. */
export function useCommitWalletTx() {
  const qc = useQueryClient();
  const notify = useNotifications((s) => s.add);

  return useMutation({
    mutationFn: async (tx: WalletTx) => tx,
    onSuccess: (tx) => {
      qc.setQueryData<WalletTx[]>(TX_KEY, (old = []) => [tx, ...old]);
      qc.setQueryData<WalletBalance>(BAL_KEY, (old = seedBalance) => {
        const net = tx.amount + (tx.fee ?? 0);
        if (tx.type === "deposit" && tx.status === "completed") {
          return { ...old, available: old.available + tx.amount, total: old.total + tx.amount };
        }
        if (tx.type === "withdrawal" && tx.status === "pending") {
          // reserve funds
          return { ...old, available: old.available - net, pending: old.pending + net };
        }
        if (tx.type === "withdrawal" && tx.status === "completed") {
          return { ...old, pending: Math.max(0, old.pending - net), total: old.total - net };
        }
        return old;
      });

      // notifications
      if (tx.type === "deposit" && tx.status === "completed") {
        notify({ type: "system", title: "تم الإيداع بنجاح", body: `تمت إضافة ${tx.amount.toLocaleString("ar-EG")} ج.م إلى محفظتك` });
      } else if (tx.type === "withdrawal" && tx.status === "pending") {
        notify({ type: "system", title: "تم استلام طلب السحب", body: `طلب سحب بقيمة ${tx.amount.toLocaleString("ar-EG")} ج.م قيد المراجعة` });
      }
    },
  });
}
