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
import { useMoney } from "@/lib/format";
import { formatDate } from "@/services/mock-data";
import { ShieldCheck, AlertTriangle, RefreshCcw, DollarSign, Eye } from "lucide-react";
import type { Escrow } from "@/services/escrow-data";

export const Route = createFileRoute("/admin/escrow")({ component: AdminEscrowPage });

function AdminEscrowPage() {
  const money = useMoney();
  const { data } = useEscrows();
  const [selected, setSelected] = useState<Escrow | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => (data ?? []).filter((e) => {
    if (status !== "all" && e.status !== status) return false;
    if (q && !`${e.id} ${e.vehicle} ${e.buyerName} ${e.agencyName}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [data, q, status]);

  const kpis = useMemo(() => {
    const list = data ?? [];
    return {
      held: list.filter((e) => !["released", "refunded"].includes(e.status)).reduce((s, e) => s + e.amount + e.shippingCost, 0),
      active: list.filter((e) => !["released", "refunded", "disputed"].includes(e.status)).length,
      disputes: list.filter((e) => e.status === "disputed").length,
      refunded: list.filter((e) => e.status === "refunded").length,
    };
  }, [data]);

  return (
    <DashboardLayout title="إدارة الضمانات">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard title="إجمالي محتجز" value={money(kpis.held)} icon={DollarSign} tone="primary" />
        <KpiCard title="ضمانات نشطة" value={String(kpis.active)} icon={ShieldCheck} />
        <KpiCard title="نزاعات" value={String(kpis.disputes)} icon={AlertTriangle} tone="destructive" />
        <KpiCard title="استرداد" value={String(kpis.refunded)} icon={RefreshCcw} />
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <Input className="flex-1 min-w-[220px]" placeholder="بحث بالضمان أو الطرف..." value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="pending_payment">بانتظار الدفع</SelectItem>
            <SelectItem value="paid">تم الدفع</SelectItem>
            <SelectItem value="purchased">تم الشراء</SelectItem>
            <SelectItem value="shipping">قيد الشحن</SelectItem>
            <SelectItem value="awaiting_confirmation">بانتظار المشتري</SelectItem>
            <SelectItem value="released">مكتمل</SelectItem>
            <SelectItem value="disputed">نزاع</SelectItem>
            <SelectItem value="refunded">مسترد</SelectItem>
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
                  <th className="p-3 text-start">المعرض</th>
                  <th className="p-3 text-start">المبلغ</th>
                  <th className="p-3 text-start">العمولة</th>
                  <th className="p-3 text-start">الحالة</th>
                  <th className="p-3 text-start">التاريخ</th>
                  <th className="p-3 text-start">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className={`border-t hover:bg-muted/20 cursor-pointer ${e.status === "disputed" ? "bg-destructive/5" : ""}`} onClick={() => setSelected(e)}>
                    <td className="p-3 font-mono">{e.id}</td>
                    <td className="p-3">{e.vehicle}</td>
                    <td className="p-3">{e.buyerName}</td>
                    <td className="p-3">{e.agencyName}</td>
                    <td className="p-3 font-semibold">{money(e.amount + e.shippingCost)}</td>
                    <td className="p-3 text-primary">{money(e.commission)}</td>
                    <td className="p-3"><StatusBadge status={e.status} /></td>
                    <td className="p-3 text-muted-foreground">{formatDate(e.createdAt)}</td>
                    <td className="p-3">
                      <Button size="sm" variant="outline" onClick={(ev) => { ev.stopPropagation(); setSelected(e); }}>
                        <Eye className="ml-1 size-4" /> إدارة
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">لا توجد ضمانات مطابقة</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <EscrowDetailsDialog escrow={selected} role="admin" open={!!selected} onOpenChange={(o) => !o && setSelected(null)} />
    </DashboardLayout>
  );
}
