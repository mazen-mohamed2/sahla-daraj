import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, Check } from "lucide-react";

const STEPS = ["نوع المركبة","المواصفات","الوسائط","التسعير","المراجعة"];

export function ListingWizard({ onDone }: { onDone?: () => void }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    type: "", make: "", model: "", year: "", km: "", color: "", city: "", price: "", desc: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const pct = ((step + 1) / STEPS.length) * 100;

  const stepContent: ReactNode[] = [
    <div key={0} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {["سيدان","دفع رباعي","كوبيه","بيك أب"].map((t) => (
        <button key={t} type="button" onClick={() => set("type", t)}
          className={`rounded-xl border-2 p-6 text-center font-semibold transition ${form.type === t ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
          {t}
        </button>
      ))}
    </div>,
    <div key={1} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div><Label>الصانع</Label><Input value={form.make} onChange={(e) => set("make", e.target.value)} placeholder="تويوتا" /></div>
      <div><Label>الطراز</Label><Input value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="كامري" /></div>
      <div><Label>السنة</Label><Input type="number" value={form.year} onChange={(e) => set("year", e.target.value)} placeholder="2022" /></div>
      <div><Label>الكيلومترات</Label><Input type="number" value={form.km} onChange={(e) => set("km", e.target.value)} placeholder="45000" /></div>
      <div><Label>اللون</Label><Input value={form.color} onChange={(e) => set("color", e.target.value)} placeholder="أبيض" /></div>
      <div><Label>المدينة</Label>
        <Select value={form.city} onValueChange={(v) => set("city", v)}>
          <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
          <SelectContent>
            {["الرياض","جدة","الدمام","مكة","المدينة"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>,
    <div key={2} className="rounded-xl border-2 border-dashed p-10 text-center">
      <Upload className="mx-auto mb-3 size-10 text-muted-foreground" />
      <div className="font-medium">اسحب الصور هنا أو اضغط للرفع</div>
      <div className="mt-1 text-sm text-muted-foreground">حتى 10 صور، JPG/PNG</div>
      <Button variant="outline" className="mt-4">اختيار الملفات</Button>
    </div>,
    <div key={3} className="space-y-4">
      <div><Label>السعر (ريال)</Label><Input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="150000" /></div>
      <div><Label>وصف الإعلان</Label><Textarea rows={5} value={form.desc} onChange={(e) => set("desc", e.target.value)} placeholder="اكتب وصفًا مميزًا..." /></div>
    </div>,
    <div key={4} className="space-y-3">
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="mb-3 font-semibold">ملخص الإعلان</div>
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          {Object.entries(form).map(([k, v]) => v && (
            <div key={k} className="flex justify-between border-b py-1"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
          ))}
        </dl>
      </div>
    </div>,
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="font-display">{STEPS[step]}</CardTitle>
          <div className="text-sm text-muted-foreground">{step + 1} / {STEPS.length}</div>
        </div>
        <Progress value={pct} className="mt-3" />
      </CardHeader>
      <CardContent>{stepContent[step]}</CardContent>
      <CardFooter className="flex justify-between gap-2">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>السابق</Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)}>التالي</Button>
        ) : (
          <Button onClick={() => { toast.success("تم نشر الإعلان بنجاح"); onDone?.(); }}>
            <Check className="ml-2 size-4" /> نشر الإعلان
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
