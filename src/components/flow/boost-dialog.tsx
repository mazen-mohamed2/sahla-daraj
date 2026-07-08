import { useState } from "react";
import { MultiStepDialog, PaymentMethodPicker, ReviewRow, ProcessingStep, SuccessStep, FailureStep, StepFooter, METHOD_LABEL, type PaymentMethod, useMockProcess } from "@/components/flow";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useMoney } from "@/lib/format";
import { Rocket } from "lucide-react";

const PACKAGES = [
  { days: 3, price: 100, label: "3 أيام" },
  { days: 7, price: 200, label: "أسبوع", tag: "الأكثر شعبية" },
  { days: 30, price: 700, label: "شهر", tag: "الأوفر" },
];

const STEPS = [
  { key: "pkg", label: "الباقة" },
  { key: "method", label: "الدفع" },
  { key: "review", label: "المراجعة" },
  { key: "done", label: "التأكيد" },
];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  listingTitle: string;
  onSuccess: (days: number) => void;
}

export function BoostDialog({ open, onOpenChange, listingTitle, onSuccess }: Props) {
  const money = useMoney();
  const [step, setStep] = useState(0);
  const [pkg, setPkg] = useState(1);
  const [method, setMethod] = useState<PaymentMethod>("vodafone");
  const [account, setAccount] = useState("");
  const [acctError, setAcctError] = useState<string | undefined>();
  const proc = useMockProcess();
  const selected = PACKAGES[pkg];

  const close = () => {
    onOpenChange(false);
    setTimeout(() => { setStep(0); setPkg(1); setMethod("vodafone"); setAccount(""); setAcctError(undefined); proc.reset(); }, 300);
  };

  const nextMethod = () => {
    if (account.trim().length < 6) { setAcctError("بيانات الدفع غير صحيحة"); return; }
    setAcctError(undefined); setStep(2);
  };

  const confirm = async () => {
    setStep(3);
    const ok = await proc.run(async () => onSuccess(selected.days));
    if (!ok) return;
  };

  return (
    <MultiStepDialog open={open} onOpenChange={(o) => !o && close()} title={`تعزيز إعلان: ${listingTitle}`} steps={STEPS} currentStep={Math.min(step, 3)} locked={proc.status === "processing"}>
      {step === 0 && (
        <div>
          <Label className="mb-2 block">مدة التعزيز</Label>
          <div className="space-y-2">
            {PACKAGES.map((p, i) => {
              const active = i === pkg;
              return (
                <button key={p.days} type="button" onClick={() => setPkg(i)}
                  className={cn("w-full flex justify-between items-center rounded-lg border p-3 transition-all", active ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "hover:bg-muted/40")}>
                  <div className="flex items-center gap-2">
                    <Rocket className={cn("size-4", active && "text-primary")} />
                    <div className="text-start">
                      <div className="font-semibold">{p.label}</div>
                      {p.tag && <div className="text-[10px] bg-success/15 text-success rounded px-1.5 py-0.5 inline-block">{p.tag}</div>}
                    </div>
                  </div>
                  <div className="font-bold">{money(p.price)}</div>
                </button>
              );
            })}
          </div>
          <StepFooter>
            <Button variant="outline" className="flex-1" onClick={close}>إلغاء</Button>
            <Button className="flex-1" onClick={() => setStep(1)}>متابعة</Button>
          </StepFooter>
        </div>
      )}
      {step === 1 && (
        <div>
          <PaymentMethodPicker value={method} onChange={setMethod} account={account} onAccountChange={setAccount} error={acctError} />
          <StepFooter>
            <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>رجوع</Button>
            <Button className="flex-1" onClick={nextMethod}>متابعة</Button>
          </StepFooter>
        </div>
      )}
      {step === 2 && (
        <div>
          <div className="rounded-lg border p-3">
            <ReviewRow label="الإعلان" value={listingTitle} />
            <ReviewRow label="المدة" value={selected.label} />
            <ReviewRow label="السعر" value={money(selected.price)} emphasis />
            <ReviewRow label="طريقة الدفع" value={METHOD_LABEL[method]} />
            <ReviewRow label="الحساب" value={<span className="font-mono">{account}</span>} />
          </div>
          <StepFooter>
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>رجوع</Button>
            <Button className="flex-1" onClick={confirm}>تأكيد التعزيز</Button>
          </StepFooter>
        </div>
      )}
      {step === 3 && proc.status === "processing" && <ProcessingStep />}
      {step === 3 && proc.status === "success" && (
        <SuccessStep title="تم تعزيز إعلانك" message={<>سيظهر إعلانك في أعلى النتائج لمدة <strong>{selected.label}</strong>.</>} onPrimary={close} />
      )}
      {step === 3 && proc.status === "error" && <FailureStep message={proc.error ?? undefined} onRetry={confirm} onCancel={close} />}
    </MultiStepDialog>
  );
}
