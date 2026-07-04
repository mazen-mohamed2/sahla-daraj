import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useKPIs, useRevenue, useTransactions } from "@/hooks/queries";
import { formatSAR, formatDate } from "@/services/mock-data";
import { Wallet, Car, ShieldCheck, Users } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";

export const Route = createFileRoute("/admin/")({ component: AdminOverview });

function AdminOverview() {
  const { data: kpi, isLoading } = useKPIs();
  const { data: revenue } = useRevenue();
  const { data: txs, isLoading: txLoading } = useTransactions();

  return (
    <DashboardLayout title="نظرة عامة">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading || !kpi ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <KpiCard title="إجمالي الإيرادات" value={formatSAR(kpi.totalRevenue)} icon={Wallet} change="+12.4% هذا الشهر" tone="success" />
            <KpiCard title="الإعلانات النشطة" value={kpi.activeListings.toLocaleString("ar-SA")} icon={Car} tone="primary" />
            <KpiCard title="الضمانات المعلقة" value={kpi.pendingEscrows.toLocaleString("ar-SA")} icon={ShieldCheck} tone="warning" />
            <KpiCard title="المستخدمون النشطون" value={kpi.activeUsers.toLocaleString("ar-SA")} icon={Users} tone="primary" />
          </>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="font-display">الإيرادات الشهرية</CardTitle></CardHeader>
          <CardContent className="h-80">
            {revenue ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenue}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" stroke="var(--color-muted-foreground)" reversed />
                  <YAxis stroke="var(--color-muted-foreground)" orientation="right" />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, direction: "rtl" }} />
                  <Area type="monotone" dataKey="revenue" stroke="var(--color-chart-1)" fill="url(#rev)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <Skeleton className="h-full w-full" />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display">المعاملات الأخيرة</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {txLoading || !txs ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />) :
              txs.slice(0, 6).map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-2 border-b pb-2 last:border-0">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{t.buyer}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</div>
                  </div>
                  <div className="text-left shrink-0">
                    <div className="text-sm font-bold">{formatSAR(t.amount)}</div>
                    <StatusBadge status={t.status} />
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
