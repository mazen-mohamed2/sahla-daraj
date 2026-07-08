import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowDownToLine, ArrowUpFromLine, Wallet, ArrowDown, ArrowUp } from "lucide-react";
import { useWalletTx } from "@/hooks/queries";
import { formatDate } from "@/services/mock-data";
import { useMoney } from "@/lib/format";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { DepositDialog, WithdrawDialog, METHOD_LABEL, type PaymentMethod } from "@/components/flow";

export const Route = createFileRoute("/user/wallet")({ component: WalletPage });

const TYPE_LABEL: Record<string, string> = {
  deposit: "إيداع", withdrawal: "سحب", escrow_hold: "حجز ضمان", escrow_release: "إفراج ضمان", fee: "رسوم",
};

type Tx = { id: string; type: string; amount: number; createdAt: string; method?: string };

function WalletPage() {
  const money = useMoney();
  const { data, isLoading } = useWalletTx();
  const [balance, setBalance] = useState(45300);
  const [depOpen, setDepOpen] = useState(false);
  const [wdOpen, setWdOpen] = useState(false);
  const [extraTx, setExtraTx] = useState<Tx[]>([]);

  const onDeposit = (p: { amount: number; method: PaymentMethod; ref: string }) => {
    setBalance((b) => b + p.amount);
    setExtraTx((x) => [{ id: p.ref, type: "deposit", amount: p.amount, createdAt: new Date().toISOString(), method: METHOD_LABEL[p.method] }, ...x]);
    toast.success(`تم إيداع ${money(p.amount)} في محفظتك`);
  };
  const onWithdraw = (p: { amount: number; method: PaymentMethod; ref: string }) => {
    setBalance((b) => b - p.amount);
    setExtraTx((x) => [{ id: p.ref, type: "withdrawal", amount: p.amount, createdAt: new Date().toISOString(), method: METHOD_LABEL[p.method] }, ...x]);
    toast.success("تم تسجيل طلب السحب");
  };

  const allTx = [...extraTx, ...(data ?? [])];

  return (
    <DashboardLayout title="المحفظة">
      <Card className="bg-gradient-to-l from-primary to-primary/70 text-primary-foreground">
        <CardContent className="p-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm opacity-90"><Wallet className="size-4" /> رصيدك المتاح</div>
            <div className="mt-1 font-display text-5xl font-black">{money(balance)}</div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setDepOpen(true)}>
              <ArrowDownToLine className="ml-2 size-4" /> إيداع
            </Button>
            <Button variant="outline" className="bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => setWdOpen(true)}>
              <ArrowUpFromLine className="ml-2 size-4" /> طلب سحب
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader><CardTitle className="font-display">سجل المعاملات</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />) :
            allTx.map((t) => {
              const positive = t.type === "deposit" || t.type === "escrow_release";
              return (
                <div key={t.id} className="flex items-center justify-between gap-2 rounded-lg border p-3 animate-in fade-in-50">
                  <div className="flex items-center gap-3">
                    <div className={`grid size-10 place-items-center rounded-lg ${positive ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive"}`}>
                      {positive ? <ArrowDown className="size-4" /> : <ArrowUp className="size-4" />}
                    </div>
                    <div>
                      <div className="font-medium">{TYPE_LABEL[t.type]} {"method" in t && t.method ? <span className="text-xs text-muted-foreground">· {t.method}</span> : null}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(t.createdAt)} · <span className="font-mono">{t.id}</span></div>
                    </div>
                  </div>
                  <div className={`font-bold ${positive ? "text-success" : "text-destructive"}`}>
                    {positive ? "+" : "-"} {money(t.amount)}
                  </div>
                </div>
              );
            })}
        </CardContent>
      </Card>

      <DepositDialog open={depOpen} onOpenChange={setDepOpen} onComplete={onDeposit} />
      <WithdrawDialog open={wdOpen} onOpenChange={setWdOpen} availableBalance={balance} onComplete={onWithdraw} />
    </DashboardLayout>
  );
}
