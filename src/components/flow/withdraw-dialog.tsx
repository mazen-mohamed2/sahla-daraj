import { useState } from "react";
import { MultiStepDialog, ProcessingStep, SuccessStep, FailureStep, ReviewRow, StepFooter, AmountInput, PaymentMethodPicker, METHOD_LABEL, type PaymentMethod, useMockProcess } from "@/components/flow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMoney } from "@/lib/format";

interface WithdrawResult {
  amount: number;
  fee: number;
  net: number;
  method: PaymentMethod;
  reference: string;
  createdAt: string;
  bank?: { iban: string; swift: string; accountName: string; bankName: string };
  account?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  availableBalance: number;
  onComplete: (payload: WithdrawResult) => void;
}

const STEPS = [
  { key: "amount", label: "المبلغ" },
  { key: "dest", label: "الوجهة" },
  { key: "review", label: "المراجعة" },
  { key: "done", label: "التأكيد" },
];

const WITHDRAW_METHODS: PaymentMethod[] = ["bank", "vodafone", "instapay"];

export function WithdrawDialog({ open, onOpenChange, availableBalance, onComplete }: Props) {
  const money = useMoney();
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("bank");
  const [account, setAccount] = useState("");
  const [iban, setIban] = useState("");
  const [swift, setSwift] = useState("");
  const [accountName, setAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [amtError, setAmtError] = useState<string | undefined>();
  const [destError, setDestError] = useState<string | undefined>();
  const [result, setResult] = useState<WithdrawResult | null>(null);
  const proc = useMockProcess();

  const numeric = Number(amount || 0);
  const fee = 15 + Math.round(numeric * 0.005);
  const net = Math.max(0, numeric - fee);

  const close = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep(0); setAmount(""); setAccount(""); setIban(""); setSwift(""); setAccountName(""); setBankName("");
      setMethod("bank"); proc.reset(); setAmtError(undefined); setDestError(undefined); setResult(null);
    }, 300);
  };

  const nextAmount = () => {
    if (numeric < 100) return setAmtError("الحد الأدنى 100 ج.م");
    if (numeric > availableBalance) return setAmtError("المبلغ يتجاوز رصيدك المتاح");
    setAmtError(undefined); setStep(1);
  };

  const validateDest = () => {
    if (method === "bank") {
      if (!/^EG\d{2}[A-Z0-9]{20,26}$/i.test(iban.replace(/\s/g, ""))) return "رقم IBAN غير صحيح";
      if (!/^[A-Z0-9]{8,11}$/i.test(swift.replace(/\s/g, ""))) return "SWIFT Code غير صحيح";
      if (accountName.trim().length < 3) return "أدخل اسم صاحب الحساب";
      if (bankName.trim().length < 3) return "أدخل اسم البنك";
    } else {
      if (account.trim().length < 6) return "بيانات الحساب غير صحيحة";
    }
    return undefined;
  };

  const nextDest = () => {
    const err = validateDest();
    if (err) return setDestError(err);
    setDestError(undefined); setStep(2);
  };

  const confirm = async () => {
    setStep(3);
    const ok = await proc.run();
    if (!ok) return;
    const payload: WithdrawResult = {
      amount: numeric, fee, net, method,
      reference: `WD-${Date.now().toString().slice(-8)}`,
      createdAt: new Date().toISOString(),
      account: method !== "bank" ? account : undefined,
      bank: method === "bank" ? { iban, swift, accountName, bankName } : undefined,
    };
    setResult(payload);
    onComplete(payload);
  };

  return (
    <MultiStepDialog open={open} onOpenChange={(o) => !o && close()} title="طلب سحب رصيد" steps={STEPS} currentStep={Math.min(step, 3)} locked={proc.status === "processing"}>
      {step === 0 && (
        <div>
          <div className="mb-3 rounded-lg bg-muted/40 p-3 text-sm flex justify-between">
            <span className="text-muted-foreground">الرصيد المتاح</span>
            <span className="font-bold">{money(availableBalance)}</span>
          </div>
          <AmountInput value={amount} onChange={setAmount} max={availableBalance} error={amtError} hint="رسوم السحب: 15 ج.م + 0.5% من المبلغ" min={100} quickPicks={[100, 250, 500, 1000, 5000]} />
          <StepFooter>
            <Button variant="outline" className="flex-1" onClick={close}>إلغاء</Button>
            <Button className="flex-1" onClick={nextAmount}>متابعة</Button>
          </StepFooter>
        </div>
      )}
      {step === 1 && (
        <div className="space-y-4">
          <PaymentMethodPicker
            methods={WITHDRAW_METHODS}
            value={method}
            onChange={(m) => { setMethod(m); setDestError(undefined); }}
            account={account}
            onAccountChange={setAccount}
            hideAccountField={method === "bank"}
            error={method !== "bank" ? destError : undefined}
          />
          {method === "bank" && (
            <div className="space-y-3 rounded-lg border p-3 bg-muted/20">
              <div>
                <Label>IBAN</Label>
                <Input value={iban} onChange={(e) => setIban(e.target.value.toUpperCase())} placeholder="EG00 0000 0000 0000 0000 0000 00" />
              </div>
              <div>
                <Label>SWIFT Code</Label>
                <Input value={swift} onChange={(e) => setSwift(e.target.value.toUpperCase())} placeholder="NBEGEGCXXXX" />
              </div>
              <div>
                <Label>اسم صاحب الحساب</Label>
                <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="محمد أحمد علي" />
              </div>
              <div>
                <Label>اسم البنك</Label>
                <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="البنك الأهلي المصري" />
              </div>
              {destError && <p className="text-xs text-destructive">{destError}</p>}
            </div>
          )}
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
            {method === "bank" ? <>
              <ReviewRow label="اسم البنك" value={bankName} />
              <ReviewRow label="صاحب الحساب" value={accountName} />
              <ReviewRow label="IBAN" value={<span className="font-mono text-xs">{iban}</span>} />
              <ReviewRow label="SWIFT" value={<span className="font-mono text-xs">{swift}</span>} />
            </> : (
              <ReviewRow label="الحساب" value={<span className="font-mono">{account}</span>} />
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-2">⏱ تتم مراجعة طلبات السحب خلال 24-72 ساعة عمل.</div>
          <StepFooter>
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>رجوع</Button>
            <Button className="flex-1" onClick={confirm}>تأكيد طلب السحب</Button>
          </StepFooter>
        </div>
      )}
      {step === 3 && proc.status === "processing" && <ProcessingStep message="جارٍ تسجيل طلب السحب..." />}
      {step === 3 && proc.status === "success" && result && (
        <SuccessStep
          title="تم تسجيل طلب السحب"
          message={<>
            رقم الطلب: <span className="font-mono">{result.reference}</span><br />
            سيتم تحويل <strong>{money(result.net)}</strong> إلى حسابك خلال 24-72 ساعة عمل.
          </>}
          onPrimary={close}
        />
      )}
      {step === 3 && proc.status === "error" && (
        <FailureStep message={proc.error ?? undefined} onRetry={confirm} onCancel={close} />
      )}
    </MultiStepDialog>
  );
}
