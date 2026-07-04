import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useImportRequests } from "@/hooks/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { formatSAR, formatDate } from "@/services/mock-data";
import { Plus, Ship } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/user/import-requests")({ component: ImportRequests });

function ImportRequests() {
  const { data, isLoading } = useImportRequests();
  const mine = data?.slice(0, 4);

  return (
    <DashboardLayout title="طلبات الاستيراد">
      <div className="mb-4 flex justify-end">
        <Button><Plus className="ml-2 size-4" /> طلب استيراد جديد</Button>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />) :
          mine?.map((r) => (
            <Card key={r.id}>
              <CardHeader className="flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="font-display flex items-center gap-2"><Ship className="size-5 text-primary" /> {r.car.make} {r.car.model}</CardTitle>
                  <div className="text-sm text-muted-foreground">من {r.fromCountry}</div>
                </div>
                <StatusBadge status={r.status} />
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">الميزانية</span><span className="font-bold">{formatSAR(r.budget)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">التاريخ</span><span>{formatDate(r.createdAt)}</span></div>
                <Button variant="outline" size="sm" className="w-full mt-2">عرض العروض المقدمة</Button>
              </CardContent>
            </Card>
          ))}
      </div>
    </DashboardLayout>
  );
}
