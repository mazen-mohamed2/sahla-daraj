import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useImportRequests, useSubmitBid } from "@/hooks/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/services/mock-data";
import { useMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Gavel, Check } from "lucide-react";

export const Route = createFileRoute("/agency/bids")({ component: Bids });

const TOKEN_COST = 50;
const DELIVERY = ["أسبوع", "أسبوعين", "شهر", "شهرين", "3 أشهر"];
const WARRANTY = ["بدون ضمان", "6 أشهر", "سنة", "سنتين"];
const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  open: { label: "جديد", variant: "default" },
  bidding: { label: "عروض جارية", variant: "secondary" },
  closed: { label: "مغلق", variant: "outline" },
};

function Bids() {
  const money = useMoney();
  const { data, isLoading } = useImportRequests();
  const submitBid = useSubmitBid();
  const [target, setTarget] = useState<{ id: string; car: { make: string; model: string } } | null>(null);
  const [country, setCountry] = useState("all");
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ amount: "", delivery: DELIVERY[2], warranty: WARRANTY[2], notes: "" });

  const countries = Array.from(new Set(data?.map((r) => r.fromCountry) ?? []));
  const filtered = data?.filter((r) => country === "all" || r.fromCountry === country);

  const doSubmit = () => {
    if (!target) return;
    const amount = Number(form.amount);
    if (!amount || amount < 1000) { toast.error("أدخل مبلغاً صحيحاً"); return; }
    submitBid.mutate(
      { requestId: target.id, amount, notes: form.notes, tokenCost: TOKEN_COST, delivery: form.delivery, warranty: form.warranty },
      {
        onSuccess: () => {
          toast.success("✅ تم إرسال عرضك، سيتم إشعار العميل");
          setSubmitted((s) => new Set(s).add(target.id));
          setTarget(null);
          setForm({ amount: "", delivery: DELIVERY[2], warranty: WARRANTY[2], notes: "" });
        },
      },
    );
  };

  return (
    <DashboardLayout title="طلبات الاستيراد">
      <div className="mb-4 flex items-center gap-2">
        <Label className="text-sm">تصفية حسب البلد:</Label>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />) :
          filtered?.map((r) => {
            const st = STATUS_LABELS[r.status] ?? STATUS_LABELS.open;
            const canBid = r.status !== "closed";
            const alreadyBid = submitted.has(r.id);
            return (
              <Card key={r.id}>
                <CardHeader className="flex-row items-start justify-between gap-2">
                  <div>
                    <CardTitle className="font-display">{r.car.make} {r.car.model}</CardTitle>
                    <div className="text-sm text-muted-foreground">من {r.fromCountry} • {r.requester}</div>
                  </div>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">الميزانية</span>
                    <span className="font-bold">{money(r.budget)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">التاريخ</span><span>{formatDate(r.createdAt)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">تكلفة تقديم العرض: {TOKEN_COST} توكن</div>
                  {alreadyBid ? (
                    <Badge className="w-full justify-center py-2" variant="secondary"><Check className="ml-1 size-4" /> تم إرسال العرض</Badge>
                  ) : canBid ? (
                    <Button className="w-full" onClick={() => setTarget(r)}>
                      <Gavel className="ml-2 size-4" /> تقديم عرض
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
      </div>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>تقديم عرض</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>مبلغ العرض (ج.م)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            <div>
              <Label>مدة التوريد</Label>
              <Select value={form.delivery} onValueChange={(v) => setForm({ ...form, delivery: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DELIVERY.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>الضمان</Label>
              <Select value={form.warranty} onValueChange={(v) => setForm({ ...form, warranty: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{WARRANTY.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>ملاحظات</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>إلغاء</Button>
            <Button onClick={doSubmit} disabled={submitBid.isPending}>إرسال العرض (سيخصم {TOKEN_COST} توكن)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
