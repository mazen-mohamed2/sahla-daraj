import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { KpiCard } from "@/components/kpi-card";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { useKPIs, useWithdrawals, useRevenue } from "@/hooks/queries";
import { formatSAR, formatDate } from "@/services/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Coins, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ColumnDef } from "@tanstack/react-table";

export const Route = createFileRoute("/admin/financial")({ component: Financial });

type Wd = { id: string; user: string; amount: number; status: string; requestedAt: string };

function Financial() {
  const { data: kpi } = useKPIs();
  const { data: wds, isLoading } = useWithdrawals();
  const { data: revenue } = useRevenue();

  const columns: ColumnDef<Wd, unknown>[] = [
    { accessorKey: "id", header: "الرقم" },
    { accessorKey: "user", header: "المستخدم" },
    { accessorKey: "amount", header: "المبلغ", cell: ({ row }) => <span className="font-semibold">{formatSAR(row.original.amount)}</span> },
    { accessorKey: "status", header: "الحالة", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "requestedAt", header: "التاريخ", cell: ({ row }) => formatDate(row.original.requestedAt) },
    { id: "actions", header: "", cell: () => (
      <div className="flex gap-1">
        <Button size="sm" variant="outline" onClick={() => toast.success("تمت الموافقة")}>موافقة</Button>
        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => toast.error("تم الرفض")}>رفض</Button>
      </div>
    )},
  ];

  return (
    <DashboardLayout title="النظرة المالية">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard title="رصيد الضمان" value={kpi ? formatSAR(kpi.escrowBalance) : "..."} icon={ShieldCheck} tone="warning" />
        <KpiCard title="رسوم المنصة" value={kpi ? formatSAR(kpi.platformFees) : "..."} icon={Coins} tone="success" />
        <KpiCard title="إجمالي الإيرادات" value={kpi ? formatSAR(kpi.totalRevenue) : "..."} icon={Wallet} tone="primary" />
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
        <DataTable columns={columns} data={wds} isLoading={isLoading} />
      </div>
    </DashboardLayout>
  );
}
