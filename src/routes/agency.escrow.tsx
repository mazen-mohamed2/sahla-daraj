import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useEscrows } from "@/hooks/escrows";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KpiCard } from "@/components/kpi-card";
import { EscrowDetailsDialog } from "@/components/escrow/escrow-details-dialog";
import { EscrowReviewAction } from "@/components/reviews/escrow-review-action";
import { useMoney } from "@/lib/format";
import { formatDate } from "@/services/mock-data";
import { ShieldCheck, ShoppingBag, Truck, CheckCircle2, Eye } from "lucide-react";
import type { Escrow } from "@/services/escrow-data";

export const Route = createFileRoute("/agency/escrow")({ component: AgencyEscrowPage });

function AgencyEscrowPage() {
  const money = useMoney();
  const { data } = useEscrows();
  const [selected, setSelected] = useState<Escrow | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => (data ?? []).filter((e) => {
    if (status !== "all" && e.status !== status) return false;
    if (q && !`${e.id} ${e.vehicle} ${e.buyerName}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [data, q, status]);

  const kpis = useMemo(() => {
    const list = data ?? [];
    return {
      pending: list.filter((e) => e.status === "paid").length,
      shipping: list.filter((e) => e.status === "shipping").length,
      awaiting: list.filter((e) => e.status === "awaiting_confirmation").length,
      earned: list.filter((e) => e.status === "released").reduce((s, e) => s + e.amount + e.shippingCost, 0),
    };
  }, [data]);

  return (
    <DashboardLayout title="ضمانات المعرض">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard title="بانتظار الشراء" value={String(kpis.pending)} icon={ShoppingBag} />
        <KpiCard title="قيد الشحن" value={String(kpis.shipping)} icon={Truck} />
        <KpiCard title="بانتظار التأكيد" value={String(kpis.awaiting)} icon={ShieldCheck} />
        <KpiCard title="إجمالي المكتمل" value={money(kpis.earned)} icon={CheckCircle2} />
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <Input className="flex-1 min-w-[220px]" placeholder="بحث..." value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="paid">بانتظار الشراء</SelectItem>
            <SelectItem value="purchased">تم الشراء</SelectItem>
            <SelectItem value="shipping">قيد الشحن</SelectItem>
            <SelectItem value="awaiting_confirmation">بانتظار المشتري</SelectItem>
            <SelectItem value="released">مكتمل</SelectItem>
            <SelectItem value="disputed">نزاع</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs">
                <tr>
                  <th className="p-3 text-start">الضمان</th>
                  <th className="p-3 text-start">السيارة</th>
                  <th className="p-3 text-start">المشتري</th>
                  <th className="p-3 text-start">المبلغ</th>
                  <th className="p-3 text-start">الحالة</th>
                  <th className="p-3 text-start">التاريخ</th>
                  <th className="p-3 text-start">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-t hover:bg-muted/20 cursor-pointer" onClick={() => setSelected(e)}>
                    <td className="p-3 font-mono">{e.id}</td>
                    <td className="p-3">{e.vehicle}</td>
                    <td className="p-3">{e.buyerName}</td>
                    <td className="p-3 font-semibold">{money(e.amount + e.shippingCost)}</td>
                    <td className="p-3"><StatusBadge status={e.status} /></td>
                    <td className="p-3 text-muted-foreground">{formatDate(e.createdAt)}</td>
                    <td className="p-3">
                      <Button size="sm" variant="outline" onClick={(ev) => { ev.stopPropagation(); setSelected(e); }}>
                        <Eye className="ml-1 size-4" /> فتح
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">لا توجد ضمانات مطابقة</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <EscrowDetailsDialog escrow={selected} role="agency" open={!!selected} onOpenChange={(o) => !o && setSelected(null)} />
    </DashboardLayout>
  );
}
