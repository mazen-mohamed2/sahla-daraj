import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowDownToLine, ArrowUpFromLine, Wallet, ArrowDown, ArrowUp, Search, AlertCircle, Inbox, Copy, RefreshCw, TrendingUp, Clock } from "lucide-react";
import { DepositDialog, WithdrawDialog, ReviewRow } from "@/components/flow";
import { useMoney } from "@/lib/format";
import { useWallet, useWalletBalance, useCommitWalletTx, type WalletTx, type WalletTxType, type WalletTxStatus } from "@/hooks/wallet";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/user/wallet")({ component: WalletPage });

const TYPE_LABEL: Record<WalletTxType, string> = {
  deposit: "إيداع", withdrawal: "سحب", escrow_hold: "حجز ضمان", escrow_release: "إفراج ضمان", fee: "رسوم",
};
const STATUS_LABEL: Record<WalletTxStatus, string> = { completed: "مكتملة", pending: "قيد المعالجة", failed: "فاشلة" };
const STATUS_STYLE: Record<WalletTxStatus, string> = {
  completed: "bg-success/15 text-success border-success/30",
  pending: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
};

function WalletPage() {
  const money = useMoney();
  const txQ = useWallet();
  const balQ = useWalletBalance();
  const commit = useCommitWalletTx();

  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [detail, setDetail] = useState<WalletTx | null>(null);

  // Filters
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | WalletTxType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | WalletTxStatus>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    const items = txQ.data ?? [];
    return items.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (dateFrom && new Date(t.createdAt) < new Date(dateFrom)) return false;
      if (dateTo && new Date(t.createdAt) > new Date(dateTo + "T23:59:59")) return false;
      if (q) {
        const s = q.toLowerCase();
        return (
          t.id.toLowerCase().includes(s) ||
          (t.reference ?? "").toLowerCase().includes(s) ||
          (t.description ?? "").toLowerCase().includes(s) ||
          String(t.amount).includes(s)
        );
      }
      return true;
    });
  }, [txQ.data, typeFilter, statusFilter, dateFrom, dateTo, q]);

  const resetFilters = () => { setQ(""); setTypeFilter("all"); setStatusFilter("all"); setDateFrom(""); setDateTo(""); };

  return (
    <DashboardLayout title="المحفظة">
      {/* Balance hero */}
      <Card className="bg-gradient-to-l from-primary to-primary/70 text-primary-foreground">
        <CardContent className="p-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm opacity-90"><Wallet className="size-4" /> رصيدك المتاح</div>
            <div className="mt-1 font-display text-5xl font-black">
              {balQ.isLoading ? <Skeleton className="h-12 w-56 bg-primary-foreground/20" /> : money(balQ.data?.available ?? 0)}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setDepositOpen(true)}>
              <ArrowDownToLine className="ml-2 size-4" /> إيداع
            </Button>
            <Button variant="outline" className="bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => setWithdrawOpen(true)}>
              <ArrowUpFromLine className="ml-2 size-4" /> طلب سحب
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={<Wallet className="size-4" />} label="الرصيد المتاح" value={balQ.data?.available ?? 0} loading={balQ.isLoading} />
        <StatCard icon={<Clock className="size-4" />} label="الرصيد المعلّق" value={balQ.data?.pending ?? 0} loading={balQ.isLoading} tone="amber" />
        <StatCard icon={<TrendingUp className="size-4" />} label="إجمالي الرصيد" value={balQ.data?.total ?? 0} loading={balQ.isLoading} tone="primary" />
      </div>

      {/* Transactions */}
      <Card className="mt-6">
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <CardTitle className="font-display">سجل المعاملات</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => txQ.refetch()} disabled={txQ.isFetching}>
            <RefreshCw className={cn("ml-1 size-3.5", txQ.isFetching && "animate-spin")} /> تحديث
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 mb-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث برقم العملية أو المرجع..." className="ps-9" />
            </div>
            <Select value={typeFilter} onValueChange={(v: "all" | WalletTxType) => setTypeFilter(v)}>
              <SelectTrigger><SelectValue placeholder="النوع" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                {(Object.keys(TYPE_LABEL) as WalletTxType[]).map((t) => (
                  <SelectItem key={t} value={t}>{TYPE_LABEL[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v: "all" | WalletTxStatus) => setStatusFilter(v)}>
              <SelectTrigger><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                {(Object.keys(STATUS_LABEL) as WalletTxStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="من" />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="إلى" />
          </div>
          {(q || typeFilter !== "all" || statusFilter !== "all" || dateFrom || dateTo) && (
            <div className="mb-3 text-xs text-muted-foreground flex items-center gap-2">
              <span>{filtered.length} نتيجة</span>
              <Button variant="link" size="sm" className="h-auto p-0" onClick={resetFilters}>مسح الفلاتر</Button>
            </div>
          )}

          {/* States */}
          {txQ.isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          )}

          {txQ.isError && !txQ.isLoading && (
            <div className="flex flex-col items-center py-10 text-center gap-3">
              <div className="size-14 rounded-full bg-destructive/10 grid place-items-center">
                <AlertCircle className="size-7 text-destructive" />
              </div>
              <div>
                <div className="font-semibold">تعذّر تحميل المعاملات</div>
                <div className="text-sm text-muted-foreground">تحقق من اتصالك ثم أعد المحاولة.</div>
              </div>
              <Button onClick={() => txQ.refetch()}><RefreshCw className="ml-2 size-4" /> إعادة المحاولة</Button>
            </div>
          )}

          {!txQ.isLoading && !txQ.isError && filtered.length === 0 && (
            <div className="flex flex-col items-center py-14 text-center gap-3">
              <div className="size-16 rounded-full bg-muted grid place-items-center">
                <Inbox className="size-8 text-muted-foreground" />
              </div>
              <div>
                <div className="font-semibold">لا توجد معاملات</div>
                <div className="text-sm text-muted-foreground">
                  {(txQ.data?.length ?? 0) === 0 ? "ابدأ بإيداع رصيد لتظهر معاملاتك هنا." : "لا نتائج مطابقة للفلاتر الحالية."}
                </div>
              </div>
              {(txQ.data?.length ?? 0) === 0 ? (
                <Button onClick={() => setDepositOpen(true)}><ArrowDownToLine className="ml-2 size-4" /> إيداع الآن</Button>
              ) : (
                <Button variant="outline" onClick={resetFilters}>مسح الفلاتر</Button>
              )}
            </div>
          )}

          {!txQ.isLoading && !txQ.isError && filtered.length > 0 && (
            <div className="space-y-2">
              {filtered.map((t) => {
                const positive = t.type === "deposit" || t.type === "escrow_release";
                return (
                  <button
                    key={t.id}
                    onClick={() => setDetail(t)}
                    className="w-full flex items-center justify-between gap-2 rounded-lg border p-3 hover:bg-muted/40 transition-colors text-start"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn("grid size-10 place-items-center rounded-lg shrink-0",
                        positive ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive")}>
                        {positive ? <ArrowDown className="size-4" /> : <ArrowUp className="size-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{t.description || TYPE_LABEL[t.type]}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span className="font-mono">{t.reference ?? t.id}</span>
                          <span>·</span>
                          <span>{new Date(t.createdAt).toLocaleDateString("ar-EG")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant="outline" className={cn("text-[10px]", STATUS_STYLE[t.status])}>{STATUS_LABEL[t.status]}</Badge>
                      <div className={cn("font-bold", positive ? "text-success" : "text-destructive")}>
                        {positive ? "+" : "-"} {money(t.amount)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deposit / Withdraw dialogs */}
      <DepositDialog
        open={depositOpen}
        onOpenChange={setDepositOpen}
        onViewTransaction={(ref) => {
          const tx = (txQ.data ?? []).find((x) => x.reference === ref);
          if (tx) setDetail(tx);
        }}
        onComplete={(p) => {
          const tx: WalletTx = {
            id: p.reference, type: "deposit", status: "completed",
            amount: p.amount, fee: p.fee, method: p.method,
            description: `إيداع عبر ${p.method}`,
            reference: p.reference, createdAt: p.createdAt,
          };
          commit.mutate(tx);
          toast.success(`✅ تم إيداع ${money(p.amount)}`);
        }}
      />
      <WithdrawDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        availableBalance={balQ.data?.available ?? 0}
        onComplete={(p) => {
          const tx: WalletTx = {
            id: p.reference, type: "withdrawal", status: "pending",
            amount: p.amount, fee: p.fee, method: p.method,
            description: `طلب سحب — ${p.bank?.bankName ?? p.method}`,
            reference: p.reference, createdAt: p.createdAt,
          };
          commit.mutate(tx);
          toast.success(`تم إرسال طلب سحب ${money(p.net)}`);
        }}
      />

      {/* Transaction detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-display">تفاصيل العملية</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={cn("grid size-12 place-items-center rounded-xl",
                  detail.type === "deposit" || detail.type === "escrow_release"
                    ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive")}>
                  {detail.type === "deposit" || detail.type === "escrow_release"
                    ? <ArrowDown className="size-5" /> : <ArrowUp className="size-5" />}
                </div>
                <div>
                  <div className="font-semibold">{detail.description || TYPE_LABEL[detail.type]}</div>
                  <Badge variant="outline" className={cn("mt-1 text-[10px]", STATUS_STYLE[detail.status])}>{STATUS_LABEL[detail.status]}</Badge>
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <ReviewRow label="رقم العملية" value={
                  <button
                    className="font-mono inline-flex items-center gap-1 hover:text-primary"
                    onClick={() => { navigator.clipboard.writeText(detail.reference ?? detail.id); toast.success("تم النسخ"); }}
                  >
                    {detail.reference ?? detail.id} <Copy className="size-3" />
                  </button>
                } />
                <ReviewRow label="النوع" value={TYPE_LABEL[detail.type]} />
                <ReviewRow label="المبلغ" value={money(detail.amount)} emphasis />
                {detail.fee ? <ReviewRow label="الرسوم" value={money(detail.fee)} /> : null}
                {detail.method ? <ReviewRow label="طريقة الدفع" value={detail.method} /> : null}
                <ReviewRow label="التاريخ" value={new Date(detail.createdAt).toLocaleString("ar-EG")} />
                {detail.escrowId ? <ReviewRow label="الضمان المرتبط" value={<span className="font-mono">{detail.escrowId}</span>} /> : null}
              </div>
              <Button className="w-full" onClick={() => setDetail(null)}>إغلاق</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function StatCard({ icon, label, value, loading, tone = "default" }: {
  icon: React.ReactNode; label: string; value: number; loading?: boolean;
  tone?: "default" | "primary" | "amber";
}) {
  const money = useMoney();
  const toneCls =
    tone === "primary" ? "bg-primary/10 text-primary" :
    tone === "amber" ? "bg-amber-500/15 text-amber-600" :
    "bg-muted text-foreground";
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-3">
        <div className={cn("grid size-10 place-items-center rounded-lg", toneCls)}>{icon}</div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="font-display text-2xl font-bold truncate">
            {loading ? <Skeleton className="h-7 w-32" /> : money(value)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
