import { useState } from "react";
import { MultiStepDialog, ProcessingStep, SuccessStep, FailureStep, ReviewRow, StepFooter, AmountInput, PaymentMethodPicker, METHOD_LABEL, type PaymentMethod, useMockProcess } from "@/components/flow";
import { Button } from "@/components/ui/button";
import { useMoney } from "@/lib/format";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onComplete: (payload: { amount: number; method: PaymentMethod; account: string; ref: string }) => void;
}

const STEPS = [
  { key: "amount", label: "المبلغ" },
  { key: "method", label: "الدفع" },
  { key: "review", label: "المراجعة" },
  { key: "done", label: "التأكيد" },
];

export function DepositDialog({ open, onOpenChange, onComplete }: Props) {
  const money = useMoney();
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("vodafone");
  const [account, setAccount] = useState("");
  const [amtError, setAmtError] = useState<string | undefined>();
  const [acctError, setAcctError] = useState<string | undefined>();
  const proc = useMockProcess();

  const numeric = Number(amount || 0);
  const fee = Math.round(numeric * 0.01);
  const total = numeric + fee;

  const close = () => {
    onOpenChange(false);
    setTimeout(() => { setStep(0); setAmount(""); setAccount(""); setMethod("vodafone"); proc.reset(); setAmtError(undefined); setAcctError(undefined); }, 300);
  };

  const nextFromAmount = () => {
    if (numeric < 50) { setAmtError("الحد الأدنى للإيداع 50 ج.م"); return; }
    if (numeric > 500000) { setAmtError("الحد الأقصى 500,000 ج.م"); return; }
    setAmtError(undefined); setStep(1);
  };
  const nextFromMethod = () => {
    if (account.trim().length < 6) { setAcctError("بيانات الدفع غير صحيحة"); return; }
    setAcctError(undefined); setStep(2);
  };
  const confirm = async () => {
    setStep(3);
    const ok = await proc.run(async () => {
      onComplete({ amount: numeric, method, account, ref: `DEP-${Date.now()}` });
    });
    if (!ok) return;
  };

  return (
    <MultiStepDialog open={open} onOpenChange={(o) => !o && close()} title="إيداع في المحفظة" steps={STEPS} currentStep={Math.min(step, 3)} locked={proc.status === "processing"}>
      {step === 0 && (
        <div>
          <AmountInput value={amount} onChange={setAmount} error={amtError} hint="الرسوم 1% على كل إيداع" min={50} />
          <StepFooter>
            <Button variant="outline" className="flex-1" onClick={close}>إلغاء</Button>
            <Button className="flex-1" onClick={nextFromAmount}>متابعة</Button>
          </StepFooter>
        </div>
      )}
      {step === 1 && (
        <div>
          <PaymentMethodPicker value={method} onChange={setMethod} account={account} onAccountChange={setAccount} error={acctError} />
          <StepFooter>
            <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>رجوع</Button>
            <Button className="flex-1" onClick={nextFromMethod}>متابعة</Button>
          </StepFooter>
        </div>
      )}
      {step === 2 && (
        <div>
          <div className="rounded-lg border p-3">
            <ReviewRow label="المبلغ" value={money(numeric)} />
            <ReviewRow label="الرسوم (1%)" value={money(fee)} />
            <ReviewRow label="الإجمالي المستقطع" value={money(total)} emphasis />
            <ReviewRow label="طريقة الدفع" value={METHOD_LABEL[method]} />
            <ReviewRow label="الحساب" value={<span className="font-mono">{account}</span>} />
          </div>
          <StepFooter>
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>رجوع</Button>
            <Button className="flex-1" onClick={confirm}>تأكيد الإيداع</Button>
          </StepFooter>
        </div>
      )}
      {step === 3 && proc.status === "processing" && <ProcessingStep message="جارٍ التواصل مع مزود الدفع..." />}
      {step === 3 && proc.status === "success" && (
        <SuccessStep title="تم الإيداع بنجاح" message={<>تمت إضافة <strong>{money(numeric)}</strong> إلى محفظتك. رقم العملية: <span className="font-mono">DEP-{Date.now().toString().slice(-6)}</span></>} onPrimary={close} />
      )}
      {step === 3 && proc.status === "error" && (
        <FailureStep message={proc.error ?? undefined} onRetry={confirm} onCancel={close} />
      )}
    </MultiStepDialog>
  );
}
