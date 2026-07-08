import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { KpiCard } from "@/components/kpi-card";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { useKPIs, useWithdrawals, useRevenue, useUpdateWithdrawalStatus } from "@/hooks/queries";
import { formatDate } from "@/services/mock-data";
import { useMoney } from "@/lib/format";
import { exportCSV } from "@/lib/csv";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Coins, ShieldCheck, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ConfirmDialog, ReasonDialog } from "@/components/flow";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ColumnDef } from "@tanstack/react-table";

const WD_REJECT_REASONS = ["بيانات الحساب غير صحيحة", "نشاط مشبوه", "رصيد غير كافٍ", "عدم توثيق الحساب", "أخرى"];

export const Route = createFileRoute("/admin/financial")({ component: Financial });

type Wd = { id: string; user: string; amount: number; status: string; requestedAt: string };

function Financial() {
  const money = useMoney();
  const { data: kpi } = useKPIs();
  const { data: wds, isLoading } = useWithdrawals();
  const { data: revenue } = useRevenue();
  const updateWd = useUpdateWithdrawalStatus();
  const [approveTarget, setApproveTarget] = useState<Wd | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Wd | null>(null);

  const columns: ColumnDef<Wd, unknown>[] = [
    { accessorKey: "id", header: "الرقم" },
    { accessorKey: "user", header: "المستخدم" },
    { accessorKey: "amount", header: "المبلغ", cell: ({ row }) => <span className="font-semibold">{money(row.original.amount)}</span> },
    { accessorKey: "status", header: "الحالة", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "requestedAt", header: "التاريخ", cell: ({ row }) => formatDate(row.original.requestedAt) },
    { id: "actions", header: "", enableSorting: false, cell: ({ row }) => {
      const w = row.original;
      if (w.status !== "pending") return <span className="text-xs text-muted-foreground">—</span>;
      return (
        <div className="flex gap-1">
          <Button size="sm" variant="outline"
            onClick={() => updateWd.mutate({ id: w.id, status: "approved" }, { onSuccess: () => toast.success("✅ تمت الموافقة على السحب") })}>
            موافقة
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive"
            onClick={() => updateWd.mutate({ id: w.id, status: "rejected" }, { onSuccess: () => toast.error("تم رفض السحب") })}>
            رفض
          </Button>
        </div>
      );
    }},
  ];

  return (
    <DashboardLayout title="النظرة المالية">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard title="رصيد الضمان" value={kpi ? money(kpi.escrowBalance) : "..."} icon={ShieldCheck} tone="warning" />
        <KpiCard title="رسوم المنصة" value={kpi ? money(kpi.platformFees) : "..."} icon={Coins} tone="success" />
        <KpiCard title="إجمالي الإيرادات" value={kpi ? money(kpi.totalRevenue) : "..."} icon={Wallet} tone="primary" />
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle className="font-display">رسوم المنصة الشهرية</CardTitle></CardHeader>
        <CardContent className="h-72">
          {revenue && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" reversed />
                <YAxis stroke="var(--color-muted-foreground)" orientation="right" />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, direction: "rtl" }} />
                <Bar dataKey="fees" fill="var(--color-chart-1)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <h2 className="mb-3 font-display text-lg font-bold">طلبات السحب</h2>
        <DataTable
          columns={columns}
          data={wds}
          isLoading={isLoading}
          statusOptions={[
            { value: "pending", label: "معلق" },
            { value: "approved", label: "موافق عليه" },
            { value: "rejected", label: "مرفوض" },
          ]}
          toolbar={
            <Button size="sm" variant="outline" onClick={() => wds && exportCSV(wds, "withdrawals")}>
              <Download className="ml-1 size-4" /> تصدير
            </Button>
          }
        />
      </div>
    </DashboardLayout>
  );
}
