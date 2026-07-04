import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useImportRequests } from "@/hooks/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatSAR, formatDate } from "@/services/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Gavel } from "lucide-react";

export const Route = createFileRoute("/agency/bids")({ component: Bids });

function Bids() {
  const { data, isLoading } = useImportRequests();
  const [target, setTarget] = useState<null | { id: string }>(null);
  const [bid, setBid] = useState("");

  return (
    <DashboardLayout title="طلبات الاستيراد">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />) :
          data?.filter((r) => r.status !== "closed").map((r) => (
            <Card key={r.id}>
              <CardHeader className="flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="font-display">{r.car.make} {r.car.model}</CardTitle>
                  <div className="text-sm text-muted-foreground">من {r.fromCountry} • {r.requester}</div>
                </div>
                <StatusBadge status={r.status} />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">الميزانية</span>
                  <span className="font-bold">{formatSAR(r.budget)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">التاريخ</span><span>{formatDate(r.createdAt)}</span>
                </div>
                <Button className="w-full" onClick={() => setTarget(r)}>
                  <Gavel className="ml-2 size-4" /> تقديم عرض
                </Button>
              </CardContent>
            </Card>
          ))}
      </div>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>تقديم عرض</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>مبلغ العرض (ريال)</Label><Input type="number" value={bid} onChange={(e) => setBid(e.target.value)} /></div>
            <div><Label>ملاحظات</Label><Input placeholder="مدة التوريد، الضمان..." /></div>
            <Button className="w-full" onClick={() => { toast.success("تم إرسال العرض"); setTarget(null); setBid(""); }}>إرسال</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
