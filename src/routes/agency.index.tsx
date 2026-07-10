import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useListings, useRevenue } from "@/hooks/queries";
import { useMoney } from "@/lib/format";
import { Car, Coins, Gavel, TrendingUp } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { ReputationSummaryCard } from "@/components/reviews/reputation-summary-card";

export const Route = createFileRoute("/agency/")({ component: AgencyOverview });

function AgencyOverview() {
  const money = useMoney();
  const { data: listings } = useListings();
  const { data: rev } = useRevenue();

  return (
    <DashboardLayout title="نظرة عامة — المعرض">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="إعلاناتي" value={listings ? listings.length.toString() : "..."} icon={Car} tone="primary" />
        <KpiCard title="رصيد التوكن" value="2,450" icon={Coins} tone="warning" />
        <KpiCard title="العروض النشطة" value="14" icon={Gavel} tone="success" />
        <KpiCard title="إيرادات الشهر" value={money(298000)} icon={TrendingUp} change="+18%" tone="success" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-1"><ReputationSummaryCard role="agency" /></div>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle className="font-display">أداء الإيرادات</CardTitle></CardHeader>
        <CardContent className="h-80">
          {rev ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rev}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" reversed stroke="var(--color-muted-foreground)" />
                <YAxis orientation="right" stroke="var(--color-muted-foreground)" />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, direction: "rtl" }} />
                <Line type="monotone" dataKey="revenue" stroke="var(--color-chart-1)" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <Skeleton className="h-full w-full" />}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
