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
import { Skeleton } from "@/components/ui/skeleton";
import { Gavel, Check } from "lucide-react";
import { MultiStepDialog, ReviewRow, ProcessingStep, SuccessStep, FailureStep, StepFooter, useMockProcess } from "@/components/flow";

export const Route = createFileRoute("/agency/bids")({ component: Bids });

const TOKEN_COST = 50;
const DELIVERY = ["أسبوع", "أسبوعين", "شهر", "شهرين", "3 أشهر"];
const WARRANTY = ["بدون ضمان", "6 أشهر", "سنة", "سنتين"];
const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  open: { label: "جديد", variant: "default" },
  bidding: { label: "عروض جارية", variant: "secondary" },
  closed: { label: "مغلق", variant: "outline" },
};

const STEPS = [
  { key: "price", label: "التفاصيل" },
  { key: "terms", label: "الشروط" },
  { key: "review", label: "المراجعة" },
  { key: "done", label: "التأكيد" },
];

function Bids() {
  const money = useMoney();
  const { data, isLoading } = useImportRequests();
  const submitBid = useSubmitBid();
  const [target, setTarget] = useState<{ id: string; car: { make: string; model: string }; budget: number } | null>(null);
  const [country, setCountry] = useState("all");
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ amount: "", delivery: DELIVERY[2], warranty: WARRANTY[2], notes: "" });
  const [amtError, setAmtError] = useState<string | undefined>();
  const proc = useMockProcess();

  const countries = Array.from(new Set(data?.map((r) => r.fromCountry) ?? []));
  const filtered = data?.filter((r) => country === "all" || r.fromCountry === country);

  const close = () => {
    setTarget(null);
    setTimeout(() => { setStep(0); setForm({ amount: "", delivery: DELIVERY[2], warranty: WARRANTY[2], notes: "" }); proc.reset(); setAmtError(undefined); }, 300);
  };

  const nextFromPrice = () => {
    const amt = Number(form.amount);
    if (!amt || amt < 1000) { setAmtError("أدخل مبلغاً 1,000 ج.م على الأقل"); return; }
    setAmtError(undefined); setStep(1);
  };

  const confirm = async () => {
    if (!target) return;
    setStep(3);
    const ok = await proc.run(async () => {
      await submitBid.mutateAsync({
        requestId: target.id, amount: Number(form.amount), notes: form.notes,
        tokenCost: TOKEN_COST, delivery: form.delivery, warranty: form.warranty,
      });
      setSubmitted((s) => new Set(s).add(target.id));
    });
    if (!ok) return;
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

      <MultiStepDialog open={!!target} onOpenChange={(o) => !o && close()} title={target ? `عرض على ${target.car.make} ${target.car.model}` : ""} steps={STEPS} currentStep={Math.min(step, 3)} locked={proc.status === "processing"}>
        {step === 0 && target && (
          <div className="space-y-3">
            <div className="rounded-lg bg-muted/40 p-3 text-sm flex justify-between">
              <span className="text-muted-foreground">ميزانية الطالب</span>
              <span className="font-bold">{money(target.budget)}</span>
            </div>
            <div>
              <Label>مبلغ العرض (ج.م)</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" />
              {amtError && <p className="text-xs text-destructive mt-1">{amtError}</p>}
            </div>
            <div><Label>ملاحظات للعميل</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="اذكر مواصفات، حالة، مصدر السيارة..." /></div>
            <StepFooter>
              <Button variant="outline" className="flex-1" onClick={close}>إلغاء</Button>
              <Button className="flex-1" onClick={nextFromPrice}>متابعة</Button>
            </StepFooter>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-3">
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
            <StepFooter>
              <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>رجوع</Button>
              <Button className="flex-1" onClick={() => setStep(2)}>متابعة</Button>
            </StepFooter>
          </div>
        )}
        {step === 2 && target && (
          <div>
            <div className="rounded-lg border p-3">
              <ReviewRow label="السيارة" value={`${target.car.make} ${target.car.model}`} />
              <ReviewRow label="السعر المعروض" value={money(Number(form.amount))} emphasis />
              <ReviewRow label="مدة التوريد" value={form.delivery} />
              <ReviewRow label="الضمان" value={form.warranty} />
              <ReviewRow label="تكلفة تقديم العرض" value={`${TOKEN_COST} توكن`} />
            </div>
            {form.notes && <div className="mt-3 rounded-lg border p-3 text-sm"><div className="text-xs text-muted-foreground mb-1">ملاحظات</div>{form.notes}</div>}
            <StepFooter>
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>رجوع</Button>
              <Button className="flex-1" onClick={confirm}>إرسال العرض</Button>
            </StepFooter>
          </div>
        )}
        {step === 3 && proc.status === "processing" && <ProcessingStep message="جارٍ إرسال العرض وخصم الرصيد..." />}
        {step === 3 && proc.status === "success" && (
          <SuccessStep title="تم إرسال العرض" message={<>سيتم إشعار العميل. تم خصم <strong>{TOKEN_COST}</strong> توكن.</>} onPrimary={close} />
        )}
        {step === 3 && proc.status === "error" && <FailureStep message={proc.error ?? undefined} onRetry={confirm} onCancel={close} />}
      </MultiStepDialog>
    </DashboardLayout>
  );
}
