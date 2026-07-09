import { useEffect, useState } from "react";
import { MultiStepDialog, ProcessingStep, SuccessStep, FailureStep, StepFooter, useMockProcess, ReviewRow } from "@/components/flow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BRANDS, CITIES, COUNTRIES, CONDITION_LABELS, DELIVERY_PREF_LABELS, type ImportRequest } from "@/services/import-data";
import { useCreateImportRequest, useUpdateImportRequest } from "@/hooks/import-requests";
import { useMoney } from "@/lib/format";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing?: ImportRequest | null;
  onDone?: (id: string) => void;
}

type FormState = {
  brand: string; model: string; year: string;
  condition: ImportRequest["condition"]; mileage: string;
  fuel: ImportRequest["fuel"]; transmission: ImportRequest["transmission"];
  budget: string; color: string; notes: string;
  destination: string; deliveryPreference: ImportRequest["deliveryPreference"];
  fromCountry: string;
};

const empty: FormState = {
  brand: "", model: "", year: String(new Date().getFullYear()),
  condition: "used", mileage: "0",
  fuel: "بنزين", transmission: "أوتوماتيك",
  budget: "", color: "أبيض لؤلؤي", notes: "",
  destination: "القاهرة", deliveryPreference: "standard",
  fromCountry: "اليابان",
};

const STEPS = [
  { key: "vehicle", label: "بيانات السيارة" },
  { key: "requirements", label: "المتطلبات" },
  { key: "shipping", label: "الشحن" },
  { key: "review", label: "المراجعة" },
];

export function ImportRequestWizard({ open, onOpenChange, editing, onDone }: Props) {
  const money = useMoney();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(empty);
  const [err, setErr] = useState<string | null>(null);
  const create = useCreateImportRequest();
  const update = useUpdateImportRequest();
  const proc = useMockProcess();

  useEffect(() => {
    if (!open) return;
    setStep(0); setErr(null); proc.reset();
    if (editing) {
      setForm({
        brand: editing.brand, model: editing.model, year: String(editing.year),
        condition: editing.condition, mileage: String(editing.mileage),
        fuel: editing.fuel, transmission: editing.transmission,
        budget: String(editing.budget), color: editing.color, notes: editing.notes,
        destination: editing.destination, deliveryPreference: editing.deliveryPreference,
        fromCountry: editing.fromCountry ?? "اليابان",
      });
    } else {
      setForm(empty);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const validateStep = (): string | null => {
    if (step === 0) {
      if (!form.brand.trim()) return "اختر الماركة";
      if (!form.model.trim()) return "أدخل الموديل";
      const y = Number(form.year);
      if (!y || y < 1990 || y > new Date().getFullYear() + 1) return "أدخل سنة صحيحة";
    }
    if (step === 1) {
      const b = Number(form.budget);
      if (!b || b < 100000) return "الحد الأدنى للميزانية 100,000 ج.م";
    }
    if (step === 2) {
      if (!form.destination.trim()) return "اختر مدينة الاستلام";
    }
    return null;
  };

  const next = () => {
    const e = validateStep();
    if (e) { setErr(e); return; }
    setErr(null); setStep((s) => s + 1);
  };

  const submit = async () => {
    setStep(4);
    const ok = await proc.run(async () => {
      if (editing) {
        await update.mutateAsync({
          id: editing.id,
          brand: form.brand, model: form.model, year: Number(form.year),
          condition: form.condition, mileage: Number(form.mileage),
          fuel: form.fuel, transmission: form.transmission,
          budget: Number(form.budget), color: form.color, notes: form.notes,
          destination: form.destination, deliveryPreference: form.deliveryPreference,
          fromCountry: form.fromCountry,
        });
        onDone?.(editing.id);
      } else {
        const req = await create.mutateAsync({
          brand: form.brand, model: form.model, year: Number(form.year),
          condition: form.condition, mileage: Number(form.mileage),
          fuel: form.fuel, transmission: form.transmission,
          budget: Number(form.budget), color: form.color, notes: form.notes,
          destination: form.destination, deliveryPreference: form.deliveryPreference,
          fromCountry: form.fromCountry,
        });
        onDone?.(req.id);
      }
    });
    if (!ok) return;
  };

  const close = () => { onOpenChange(false); };

  return (
    <MultiStepDialog
      open={open}
      onOpenChange={(o) => { if (!o) close(); }}
      title={editing ? `تعديل طلب ${editing.id}` : "طلب استيراد جديد"}
      steps={STEPS}
      currentStep={Math.min(step, 3)}
      locked={proc.status === "processing"}
    >
      {step === 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>الماركة</Label>
              <Select value={form.brand} onValueChange={(v) => set("brand", v)}>
                <SelectTrigger><SelectValue placeholder="اختر الماركة" /></SelectTrigger>
                <SelectContent>{BRANDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>الموديل</Label><Input value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="مثال: كامري" /></div>
            <div><Label>السنة</Label><Input type="number" value={form.year} onChange={(e) => set("year", e.target.value)} /></div>
            <div>
              <Label>الحالة</Label>
              <Select value={form.condition} onValueChange={(v) => set("condition", v as ImportRequest["condition"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CONDITION_LABELS) as ImportRequest["condition"][]).map((k) => (
                    <SelectItem key={k} value={k}>{CONDITION_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>الممشى (كم)</Label><Input type="number" value={form.mileage} onChange={(e) => set("mileage", e.target.value)} /></div>
            <div>
              <Label>الوقود</Label>
              <Select value={form.fuel} onValueChange={(v) => set("fuel", v as ImportRequest["fuel"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["بنزين", "ديزل", "هجين", "كهربائي"] as const).map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>ناقل الحركة</Label>
              <Select value={form.transmission} onValueChange={(v) => set("transmission", v as ImportRequest["transmission"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="أوتوماتيك">أوتوماتيك</SelectItem>
                  <SelectItem value="مانيوال">مانيوال</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <StepFooter>
            <Button variant="outline" className="flex-1" onClick={close}>إلغاء</Button>
            <Button className="flex-1" onClick={next}>متابعة</Button>
          </StepFooter>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <div><Label>الميزانية (ج.م)</Label><Input type="number" value={form.budget} onChange={(e) => set("budget", e.target.value)} placeholder="0" /></div>
          <div><Label>اللون المفضل</Label><Input value={form.color} onChange={(e) => set("color", e.target.value)} /></div>
          <div><Label>ملاحظات</Label><Textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="مواصفات مطلوبة، إضافات..." /></div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <StepFooter>
            <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>رجوع</Button>
            <Button className="flex-1" onClick={next}>متابعة</Button>
          </StepFooter>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <div>
            <Label>مدينة الاستلام</Label>
            <Select value={form.destination} onValueChange={(v) => set("destination", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>بلد المصدر المفضل</Label>
            <Select value={form.fromCountry} onValueChange={(v) => set("fromCountry", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>أولوية التسليم</Label>
            <Select value={form.deliveryPreference} onValueChange={(v) => set("deliveryPreference", v as ImportRequest["deliveryPreference"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(DELIVERY_PREF_LABELS) as ImportRequest["deliveryPreference"][]).map((k) => (
                  <SelectItem key={k} value={k}>{DELIVERY_PREF_LABELS[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <StepFooter>
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>رجوع</Button>
            <Button className="flex-1" onClick={next}>متابعة</Button>
          </StepFooter>
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="rounded-lg border p-3">
            <ReviewRow label="السيارة" value={`${form.brand} ${form.model} ${form.year}`} />
            <ReviewRow label="الحالة" value={CONDITION_LABELS[form.condition]} />
            <ReviewRow label="الممشى" value={`${Number(form.mileage).toLocaleString("ar-EG")} كم`} />
            <ReviewRow label="الوقود / الناقل" value={`${form.fuel} • ${form.transmission}`} />
            <ReviewRow label="الميزانية" value={money(Number(form.budget))} emphasis />
            <ReviewRow label="اللون" value={form.color} />
            <ReviewRow label="الاستلام" value={`${form.destination} • ${DELIVERY_PREF_LABELS[form.deliveryPreference]}`} />
            <ReviewRow label="بلد المصدر" value={form.fromCountry} />
          </div>
          {form.notes && <div className="mt-3 rounded-lg border p-3 text-sm"><div className="text-xs text-muted-foreground mb-1">ملاحظات</div>{form.notes}</div>}
          <StepFooter>
            <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>رجوع</Button>
            <Button className="flex-1" onClick={submit}>{editing ? "حفظ التعديلات" : "نشر الطلب"}</Button>
          </StepFooter>
        </div>
      )}

      {step === 4 && proc.status === "processing" && <ProcessingStep message={editing ? "جارٍ حفظ التعديلات..." : "جارٍ نشر الطلب..."} />}
      {step === 4 && proc.status === "success" && (
        <SuccessStep
          title={editing ? "تم حفظ التعديلات" : "تم نشر الطلب"}
          message={editing ? "التعديلات ظاهرة الآن للمعارض." : "سيتم إشعار المعارض لتقديم عروضهم."}
          onPrimary={close}
        />
      )}
      {step === 4 && proc.status === "error" && <FailureStep message={proc.error ?? undefined} onRetry={submit} onCancel={close} />}
    </MultiStepDialog>
  );
}
