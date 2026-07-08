import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useEscrows, useUpdateEscrowStatus } from "@/hooks/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatDate } from "@/services/mock-data";
import { useMoney } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ShieldCheck, AlertTriangle, Info, CheckCircle2, RefreshCcw } from "lucide-react";

export const Route = createFileRoute("/user/escrow")({ component: EscrowPage });

type Escrow = { id: string; listing: string; counterparty: string; amount: number; status: string; reason?: string; createdAt: string };

const REASONS = ["عدم مطابقة الوصف", "السيارة بها عيوب خفية", "البائع لم يسلّم", "السعر غير متفق عليه", "أخرى"];

function EscrowPage() {
  const money = useMoney();
  const { data, isLoading } = useEscrows();
  const updateEscrow = useUpdateEscrowStatus();

  const [releaseTarget, setReleaseTarget] = useState<Escrow | null>(null);
  const [disputeTarget, setDisputeTarget] = useState<Escrow | null>(null);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");

  const doRelease = () => {
    if (!releaseTarget) return;
    updateEscrow.mutate(
      { id: releaseTarget.id, status: "released" },
      { onSuccess: () => { toast.success("✅ تم الإفراج عن المبلغ للبائع"); setReleaseTarget(null); } },
    );
  };
  const doDispute = () => {
    if (!disputeTarget) return;
    if (details.trim().length < 20) { toast.error("التفاصيل مطلوبة (20 حرف على الأقل)"); return; }
    updateEscrow.mutate(
      { id: disputeTarget.id, status: "disputed", reason: `${reason} — ${details}` },
      {
        onSuccess: () => {
          toast.warning("⚠️ تم فتح النزاع، سيتواصل معك فريقنا خلال 24 ساعة");
          setDisputeTarget(null); setDetails(""); setReason(REASONS[0]);
        },
      },
    );
  };

  return (
    <DashboardLayout title="حالة الضمان">
      <Card className="mb-4 border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex gap-3">
          <Info className="size-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">ما هو الضمان؟</p>
            <p className="text-muted-foreground mt-1">
              المنصة تحتجز المبلغ حتى تتأكد من استلام السيارة. عند موافقتك يُحوَّل للبائع. في حال وجود مشكلة، افتح نزاعاً.
            </p>
          </div>
        </CardContent>
      </Card>

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

                {e.status === "holding" && (
                  <div className="flex gap-2 pt-2">
                    <Button className="flex-1" onClick={() => setReleaseTarget(e)}>
                      <ShieldCheck className="ml-2 size-4" /> إفراج
                    </Button>
                    <Button variant="outline" className="flex-1 text-destructive" onClick={() => setDisputeTarget(e)}>
                      <AlertTriangle className="ml-2 size-4" /> نزاع
                    </Button>
                  </div>
                )}
                {e.status === "released" && (
                  <div className="rounded-lg bg-success/10 border border-success/40 p-3 text-sm text-success flex items-center gap-2">
                    <CheckCircle2 className="size-4" /> تم الإفراج عن المبلغ بنجاح
                  </div>
                )}
                {e.status === "disputed" && (
                  <div className="rounded-lg bg-warning/10 border border-warning/40 p-3 text-sm text-warning flex items-center gap-2">
                    <AlertTriangle className="size-4" /> جاري مراجعة النزاع
                  </div>
                )}
                {e.status === "refunded" && (
                  <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground flex items-center gap-2">
                    <RefreshCcw className="size-4" /> تم استرداد المبلغ
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
      </div>

      <AlertDialog open={!!releaseTarget} onOpenChange={(o) => !o && setReleaseTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الإفراج</AlertDialogTitle>
            <AlertDialogDescription>
              هل تأكدت من استلام السيارة وموافقتك على إتمام الصفقة؟ سيتم تحويل المبلغ للبائع فورًا ولا يمكن التراجع.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={doRelease}>تأكيد الإفراج</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!disputeTarget} onOpenChange={(o) => !o && setDisputeTarget(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>فتح نزاع</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>سبب النزاع</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>التفاصيل (20 حرف على الأقل)</Label>
              <Textarea rows={4} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="اشرح المشكلة بالتفصيل..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeTarget(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={doDispute} disabled={updateEscrow.isPending}>فتح النزاع</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
