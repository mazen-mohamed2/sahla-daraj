import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useEscrows } from "@/hooks/escrows";
import { useAuthStore } from "@/store/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/kpi-card";
import { EscrowDetailsDialog } from "@/components/escrow/escrow-details-dialog";
import { EscrowReviewAction } from "@/components/reviews/escrow-review-action";
import { ReviewDialog } from "@/components/reviews/review-dialog";
import { formatDate } from "@/services/mock-data";
import { useMoney } from "@/lib/format";
import { Info, ShieldCheck, ShoppingBag, AlertTriangle, CheckCircle2, RefreshCcw, Eye } from "lucide-react";
import type { Escrow } from "@/services/escrow-data";

export const Route = createFileRoute("/user/escrow")({ component: EscrowPage });

function EscrowPage() {
  const money = useMoney();
  const role = useAuthStore((s) => s.role);
  const { data, isLoading } = useEscrows();
  const [selected, setSelected] = useState<Escrow | null>(null);
  const [postReleaseReview, setPostReleaseReview] = useState<Escrow | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");

  const filtered = useMemo(() => {
    return (data ?? []).filter((e) => {
      if (status !== "all" && e.status !== status) return false;
      if (q && !`${e.id} ${e.vehicle} ${e.agencyName}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [data, q, status]);

  const kpis = useMemo(() => {
    const list = data ?? [];
    const held = list.filter((e) => !["released", "refunded"].includes(e.status)).reduce((s, e) => s + e.amount + e.shippingCost, 0);
    const pending = list.filter((e) => e.status === "pending_payment").length;
    const active = list.filter((e) => ["paid", "purchased", "shipping", "delivered", "awaiting_confirmation"].includes(e.status)).length;
    const disputes = list.filter((e) => e.status === "disputed").length;
    return { held, pending, active, disputes };
  }, [data]);

  return (
    <DashboardLayout title="حالة الضمان">
      <Card className="mb-4 border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex gap-3">
          <Info className="size-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">ما هو الضمان؟</p>
            <p className="text-muted-foreground mt-1">
              نحن نحتجز المبلغ في حسابنا حتى يتم شراء السيارة، شحنها، وتسليمها لك. عند تأكيدك للاستلام يُحوَّل المبلغ للمعرض. في حال وجود مشكلة، افتح نزاعاً أو اطلب استرداداً.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard title="الإجمالي المحتجز" value={money(kpis.held)} icon={ShieldCheck} />
        <KpiCard title="بانتظار الدفع" value={String(kpis.pending)} icon={ShoppingBag} />
        <KpiCard title="صفقات نشطة" value={String(kpis.active)} icon={CheckCircle2} />
        <KpiCard title="نزاعات" value={String(kpis.disputes)} icon={AlertTriangle} />
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <Input className="flex-1 min-w-[220px]" placeholder="بحث برقم الضمان أو السيارة أو المعرض..." value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="pending_payment">بانتظار الدفع</SelectItem>
            <SelectItem value="paid">تم الدفع</SelectItem>
            <SelectItem value="purchased">تم الشراء</SelectItem>
            <SelectItem value="shipping">قيد الشحن</SelectItem>
            <SelectItem value="awaiting_confirmation">بانتظار تأكيدك</SelectItem>
            <SelectItem value="released">مكتمل</SelectItem>
            <SelectItem value="disputed">نزاع</SelectItem>
            <SelectItem value="refunded">مسترد</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {isLoading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        {!isLoading && filtered.length === 0 && (
          <Card className="md:col-span-2">
            <CardContent className="p-10 text-center text-muted-foreground">لا توجد ضمانات مطابقة</CardContent>
          </Card>
        )}
        {filtered.map((e) => (
          <Card key={e.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelected(e)}>
            <CardHeader className="flex-row items-start justify-between gap-2">
              <div className="min-w-0">
                <CardTitle className="font-display truncate">{e.vehicle}</CardTitle>
                <div className="text-sm text-muted-foreground truncate">المعرض: {e.agencyName}</div>
                <div className="text-xs text-muted-foreground mt-0.5 font-mono">{e.id}</div>
              </div>
              <StatusBadge status={e.status} />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between border-b pb-2 text-sm">
                <span className="text-muted-foreground">إجمالي محتجز</span>
                <span className="font-bold text-lg">{money(e.amount + e.shippingCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">تاريخ الإنشاء</span>
                <span>{formatDate(e.createdAt)}</span>
              </div>
              {e.tracking && (
                <div className="text-xs text-muted-foreground bg-muted/40 rounded p-2">
                  🚚 {e.tracking.shippingCompany} — {e.tracking.currentStatus}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                {e.status === "pending_payment" && (
                  <Button size="sm" className="flex-1" onClick={(ev) => { ev.stopPropagation(); setSelected(e); }}>
                    <ShoppingBag className="ml-2 size-4" /> ادفع الآن
                  </Button>
                )}
                {e.status === "awaiting_confirmation" && (
                  <Button size="sm" className="flex-1" onClick={(ev) => { ev.stopPropagation(); setSelected(e); }}>
                    <ShieldCheck className="ml-2 size-4" /> تأكيد الاستلام
                  </Button>
                )}
                {e.status === "released" && (
                  <>
                    <div className="rounded-lg bg-success/10 border border-success/40 p-2 text-xs text-success flex items-center gap-2">
                      <CheckCircle2 className="size-3.5" /> مكتمل
                    </div>
                    <EscrowReviewAction escrow={e} viewerRole="user" />
                  </>
                )}
                {e.status === "refunded" && (
                  <div className="flex-1 rounded-lg bg-muted p-2 text-xs text-muted-foreground flex items-center gap-2">
                    <RefreshCcw className="size-3.5" /> تم الاسترداد
                  </div>
                )}
                {e.status === "disputed" && (
                  <div className="flex-1 rounded-lg bg-destructive/10 border border-destructive/40 p-2 text-xs text-destructive flex items-center gap-2">
                    <AlertTriangle className="size-3.5" /> نزاع قيد المراجعة
                  </div>
                )}
                <Button size="sm" variant="outline" onClick={(ev) => { ev.stopPropagation(); setSelected(e); }}>
                  <Eye className="ml-1 size-4" /> عرض
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <EscrowDetailsDialog
        escrow={selected}
        role={role === "admin" ? "admin" : role === "agency" ? "agency" : "user"}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        onDeliveryConfirmed={(e) => setPostReleaseReview(e)}
      />

      {postReleaseReview && (
        <ReviewDialog
          open
          onOpenChange={(o) => { if (!o) setPostReleaseReview(null); }}
          escrowId={postReleaseReview.id}
          reviewer={{ id: useAuthStore.getState().phone, name: useAuthStore.getState().name, role: "user" }}
          reviewee={{
            id: postReleaseReview.agencyId || postReleaseReview.agencyName,
            name: postReleaseReview.agencyName,
            role: "agency",
          }}
          onSubmitted={() => setPostReleaseReview(null)}
        />
      )}
    </DashboardLayout>
  );
}
