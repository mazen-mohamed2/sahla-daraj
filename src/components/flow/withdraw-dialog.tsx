import { useState } from "react";
import { MultiStepDialog, ProcessingStep, SuccessStep, FailureStep, ReviewRow, StepFooter, AmountInput, PaymentMethodPicker, METHOD_LABEL, type PaymentMethod, useMockProcess } from "@/components/flow";
import { Button } from "@/components/ui/button";
import { useMoney } from "@/lib/format";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  availableBalance: number;
  onComplete: (payload: { amount: number; method: PaymentMethod; account: string; ref: string }) => void;
}

const STEPS = [
  { key: "amount", label: "المبلغ" },
  { key: "dest", label: "الوجهة" },
  { key: "review", label: "المراجعة" },
  { key: "done", label: "التأكيد" },
];

export function WithdrawDialog({ open, onOpenChange, availableBalance, onComplete }: Props) {
  const money = useMoney();
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("bank");
  const [account, setAccount] = useState("");
  const [amtError, setAmtError] = useState<string | undefined>();
  const [acctError, setAcctError] = useState<string | undefined>();
  const proc = useMockProcess();

  const numeric = Number(amount || 0);
  const fee = 15 + Math.round(numeric * 0.005); // fixed + 0.5%
  const net = Math.max(0, numeric - fee);

  const close = () => {
    onOpenChange(false);
    setTimeout(() => { setStep(0); setAmount(""); setAccount(""); setMethod("bank"); proc.reset(); setAmtError(undefined); setAcctError(undefined); }, 300);
  };

  const nextAmount = () => {
    if (numeric < 100) { setAmtError("الحد الأدنى 100 ج.م"); return; }
    if (numeric > availableBalance) { setAmtError("المبلغ يتجاوز رصيدك المتاح"); return; }
    setAmtError(undefined); setStep(1);
  };
  const nextDest = () => {
    if (account.trim().length < 6) { setAcctError("بيانات الحساب غير صحيحة"); return; }
    setAcctError(undefined); setStep(2);
  };
  const confirm = async () => {
    setStep(3);
    await proc.run(async () => onComplete({ amount: numeric, method, account, ref: `WD-${Date.now()}` }));
  };

  return (
    <MultiStepDialog open={open} onOpenChange={(o) => !o && close()} title="طلب سحب رصيد" steps={STEPS} currentStep={Math.min(step, 3)} locked={proc.status === "processing"}>
      {step === 0 && (
        <div>
          <div className="mb-3 rounded-lg bg-muted/40 p-3 text-sm flex justify-between">
            <span className="text-muted-foreground">الرصيد المتاح</span>
            <span className="font-bold">{money(availableBalance)}</span>
          </div>
          <AmountInput value={amount} onChange={setAmount} max={availableBalance} error={amtError} hint="رسوم السحب: 15 ج.م + 0.5% من المبلغ" min={100} />
          <StepFooter>
            <Button variant="outline" className="flex-1" onClick={close}>إلغاء</Button>
            <Button className="flex-1" onClick={nextAmount}>متابعة</Button>
          </StepFooter>
        </div>
      )}
      {step === 1 && (
        <div>
          <PaymentMethodPicker methods={["bank", "vodafone", "instapay"]} value={method} onChange={setMethod} account={account} onAccountChange={setAccount} error={acctError} />
          <StepFooter>
            <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>رجوع</Button>
            <Button className="flex-1" onClick={nextDest}>متابعة</Button>
          </StepFooter>
        </div>
      )}
      {step === 2 && (
        <div>
          <div className="rounded-lg border p-3">
            <ReviewRow label="المبلغ المطلوب" value={money(numeric)} />
            <ReviewRow label="الرسوم" value={money(fee)} />
            <ReviewRow label="الصافي المستلم" value={money(net)} emphasis />
            <ReviewRow label="الوجهة" value={METHOD_LABEL[method]} />
            <ReviewRow label="الحساب" value={<span className="font-mono">{account}</span>} />
          </div>
          <div className="text-xs text-muted-foreground mt-2">⏱ تتم مراجعة طلبات السحب خلال 24-72 ساعة عمل.</div>
          <StepFooter>
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>رجوع</Button>
            <Button className="flex-1" onClick={confirm}>تأكيد طلب السحب</Button>
          </StepFooter>
        </div>
      )}
      {step === 3 && proc.status === "processing" && <ProcessingStep message="جارٍ تسجيل طلب السحب..." />}
      {step === 3 && proc.status === "success" && (
        <SuccessStep title="تم تسجيل طلب السحب" message={<>سيتم تحويل <strong>{money(net)}</strong> إلى حسابك خلال 24-72 ساعة عمل.</>} onPrimary={close} />
      )}
      {step === 3 && proc.status === "error" && (
        <FailureStep message={proc.error ?? undefined} onRetry={confirm} onCancel={close} />
      )}
    </MultiStepDialog>
  );
}
