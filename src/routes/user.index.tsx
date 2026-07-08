import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, Wallet, ShieldCheck, Heart, Plus } from "lucide-react";
import { useMoney } from "@/lib/format";
import { useEscrows, useListings } from "@/hooks/queries";

export const Route = createFileRoute("/user/")({ component: UserOverview });

function UserOverview() {
  const money = useMoney();
  const { data: listings } = useListings();
  const { data: escrows } = useEscrows();

  return (
    <DashboardLayout title="نظرة عامة">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="إعلاناتي" value={(listings?.length ?? 0).toString()} icon={Car} tone="primary" />
        <KpiCard title="رصيد المحفظة" value={money(45300)} icon={Wallet} tone="success" />
        <KpiCard title="الضمانات النشطة" value={(escrows?.length ?? 0).toString()} icon={ShieldCheck} tone="warning" />
        <KpiCard title="المفضلة" value="12" icon={Heart} tone="destructive" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-l from-primary to-primary/70 text-primary-foreground md:col-span-2">
          <CardHeader><CardTitle className="font-display text-primary-foreground">أعلن عن سيارتك الآن</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between gap-4 flex-wrap">
            <p className="max-w-md opacity-90">أنشئ إعلانًا احترافيًا خلال دقائق وابدأ باستقبال العروض من مشترين موثقين.</p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/user/create-listing"><Plus className="ml-2 size-4" /> إنشاء إعلان</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-display">إجراءات سريعة</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Button variant="outline" asChild><Link to="/user/wallet">المحفظة</Link></Button>
            <Button variant="outline" asChild><Link to="/user/escrow">الضمان</Link></Button>
            <Button variant="outline" asChild><Link to="/user/import-requests">استيراد</Link></Button>
            <Button variant="outline" asChild><Link to="/user/chat">الشات</Link></Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
