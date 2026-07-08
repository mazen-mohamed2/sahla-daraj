import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useEscrows } from "@/hooks/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/services/mock-data";
import { useMoney } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ShieldCheck, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/user/escrow")({ component: EscrowPage });

function EscrowPage() {
  const money = useMoney();
  const { data, isLoading } = useEscrows();

  return (
    <DashboardLayout title="حالة الضمان">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />) :
          data?.map((e) => (
            <Card key={e.id}>
              <CardHeader className="flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="font-display">{e.listing}</CardTitle>
                  <div className="text-sm text-muted-foreground">الطرف الآخر: {e.counterparty}</div>
                </div>
                <StatusBadge status={e.status} />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between border-b pb-2 text-sm">
                  <span className="text-muted-foreground">المبلغ المحجوز</span>
                  <span className="font-bold text-lg">{money(e.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">تاريخ الإنشاء</span><span>{formatDate(e.createdAt)}</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" onClick={() => toast.success("تم الإفراج عن المبلغ")}>
                    <ShieldCheck className="ml-2 size-4" /> إفراج
                  </Button>
                  <Button variant="outline" className="flex-1 text-destructive" onClick={() => toast.warning("تم فتح نزاع")}>
                    <AlertTriangle className="ml-2 size-4" /> نزاع
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </DashboardLayout>
  );
}
