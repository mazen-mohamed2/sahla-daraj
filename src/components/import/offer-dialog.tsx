import { useEffect, useState } from "react";
import { MultiStepDialog, ProcessingStep, SuccessStep, FailureStep, StepFooter, useMockProcess, ReviewRow } from "@/components/flow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMoney } from "@/lib/format";
import { useCreateOffer, useUpdateOffer } from "@/hooks/import-requests";
import type { ImportRequest, Offer } from "@/services/import-data";

const DELIVERY = ["أسبوع", "أسبوعين", "شهر", "شهرين", "3 أشهر"] as const;
const WARRANTY = ["بدون ضمان", "6 أشهر", "سنة", "سنتين"] as const;
const TOKEN_COST = 50;

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  request: ImportRequest | null;
  editing?: Offer | null;
}

const STEPS = [
  { key: "price", label: "التفاصيل" },
  { key: "terms", label: "الشروط" },
  { key: "review", label: "المراجعة" },
  { key: "done", label: "التأكيد" },
];

export function OfferDialog({ open, onOpenChange, request, editing }: Props) {
  const money = useMoney();
  const create = useCreateOffer();
  const update = useUpdateOffer();
  const proc = useMockProcess();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    price: "", shipping: "50000", delivery: DELIVERY[2] as string, warranty: WARRANTY[2] as string, notes: "",
  });
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep(0); setErr(null); proc.reset();
    if (editing) {
      setForm({
        price: String(editing.price),
        shipping: String(editing.shippingCost),
        delivery: editing.delivery,
        warranty: editing.warranty,
        notes: editing.notes,
      });
    } else {
      setForm({ price: "", shipping: "50000", delivery: DELIVERY[2], warranty: WARRANTY[2], notes: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const nextFromPrice = () => {
    const p = Number(form.price);
    if (!p || p < 10000) { setErr("أدخل مبلغاً 10,000 ج.م على الأقل"); return; }
    setErr(null); setStep(1);
  };

  const submit = async () => {
    if (!request) return;
    setStep(3);
    const ok = await proc.run(async () => {
      if (editing) {
        await update.mutateAsync({
          id: editing.id,
          price: Number(form.price),
          shippingCost: Number(form.shipping),
          delivery: form.delivery,
          warranty: form.warranty,
          notes: form.notes,
        });
      } else {
        await create.mutateAsync({
          requestId: request.id,
          price: Number(form.price),
          shippingCost: Number(form.shipping),
          delivery: form.delivery,
          warranty: form.warranty,
          notes: form.notes,
        });
      }
    });
    if (!ok) return;
  };

  const close = () => onOpenChange(false);

  return (
    <MultiStepDialog
      open={open}
      onOpenChange={(o) => !o && close()}
      title={editing ? `تعديل عرض ${editing.id}` : request ? `عرض على ${request.brand} ${request.model}` : ""}
      steps={STEPS}
      currentStep={Math.min(step, 3)}
      locked={proc.status === "processing"}
    >
      {step === 0 && request && (
        <div className="space-y-3">
          <div className="rounded-lg bg-muted/40 p-3 text-sm flex justify-between">
            <span className="text-muted-foreground">ميزانية العميل</span>
            <span className="font-bold">{money(request.budget)}</span>
          </div>
          <div>
            <Label>سعر العرض (ج.م)</Label>
            <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" />
          </div>
          <div>
            <Label>تكلفة الشحن (ج.م)</Label>
            <Input type="number" value={form.shipping} onChange={(e) => setForm({ ...form, shipping: e.target.value })} />
          </div>
          <div>
            <Label>ملاحظات للعميل</Label>
            <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="مصدر السيارة، مواصفات، تأمين الشحن..." />
          </div>
          {err && <p className="text-xs text-destructive">{err}</p>}
          <StepFooter>
            <Button variant="outline" className="flex-1" onClick={close}>إلغاء</Button>
            <Button className="flex-1" onClick={nextFromPrice}>متابعة</Button>
          </StepFooter>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <div>
            <Label>مدة التسليم</Label>
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

      {step === 2 && request && (
        <div>
          <div className="rounded-lg border p-3">
            <ReviewRow label="السيارة" value={`${request.brand} ${request.model}`} />
            <ReviewRow label="سعر العرض" value={money(Number(form.price))} emphasis />
            <ReviewRow label="تكلفة الشحن" value={money(Number(form.shipping))} />
            <ReviewRow label="الإجمالي" value={money(Number(form.price) + Number(form.shipping))} emphasis />
            <ReviewRow label="مدة التسليم" value={form.delivery} />
            <ReviewRow label="الضمان" value={form.warranty} />
            {!editing && <ReviewRow label="تكلفة إرسال العرض" value={`${TOKEN_COST} توكن`} />}
          </div>
          {form.notes && <div className="mt-3 rounded-lg border p-3 text-sm"><div className="text-xs text-muted-foreground mb-1">ملاحظات</div>{form.notes}</div>}
          <StepFooter>
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>رجوع</Button>
            <Button className="flex-1" onClick={submit}>{editing ? "حفظ التعديلات" : "إرسال العرض"}</Button>
          </StepFooter>
        </div>
      )}

      {step === 3 && proc.status === "processing" && <ProcessingStep message={editing ? "جارٍ حفظ التعديلات..." : "جارٍ إرسال العرض..."} />}
      {step === 3 && proc.status === "success" && (
        <SuccessStep title={editing ? "تم حفظ التعديلات" : "تم إرسال العرض"} message="سيتم إعلام العميل فوراً." onPrimary={close} />
      )}
      {step === 3 && proc.status === "error" && <FailureStep message={proc.error ?? undefined} onRetry={submit} onCancel={close} />}
    </MultiStepDialog>
  );
}
