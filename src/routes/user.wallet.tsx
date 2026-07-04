import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowDownToLine, ArrowUpFromLine, Wallet, ArrowDown, ArrowUp } from "lucide-react";
import { useWalletTx } from "@/hooks/queries";
import { formatSAR, formatDate } from "@/services/mock-data";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/user/wallet")({ component: WalletPage });

const TYPE_LABEL: Record<string, string> = {
  deposit: "إيداع", withdrawal: "سحب", escrow_hold: "حجز ضمان", escrow_release: "إفراج ضمان", fee: "رسوم",
};

function WalletPage() {
  const { data, isLoading } = useWalletTx();

  return (
    <DashboardLayout title="المحفظة">
      <Card className="bg-gradient-to-l from-primary to-primary/70 text-primary-foreground">
        <CardContent className="p-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm opacity-90"><Wallet className="size-4" /> رصيدك المتاح</div>
            <div className="mt-1 font-display text-5xl font-black">{formatSAR(45300)}</div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => toast.success("سيتم توجيهك للدفع")}>
              <ArrowDownToLine className="ml-2 size-4" /> إيداع
            </Button>
            <Button variant="outline" className="bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => toast.info("تم إرسال طلب السحب")}>
              <ArrowUpFromLine className="ml-2 size-4" /> طلب سحب
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader><CardTitle className="font-display">سجل المعاملات</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />) :
            data?.map((t) => {
              const positive = t.type === "deposit" || t.type === "escrow_release";
              return (
                <div key={t.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className={`grid size-10 place-items-center rounded-lg ${positive ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive"}`}>
                      {positive ? <ArrowDown className="size-4" /> : <ArrowUp className="size-4" />}
                    </div>
                    <div>
                      <div className="font-medium">{TYPE_LABEL[t.type]}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</div>
                    </div>
                  </div>
                  <div className={`font-bold ${positive ? "text-success" : "text-destructive"}`}>
                    {positive ? "+" : "-"} {formatSAR(t.amount)}
                  </div>
                </div>
              );
            })}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
