import { useState } from "react";
import { MultiStepDialog, ProcessingStep, SuccessStep, FailureStep, ReviewRow, StepFooter, AmountInput, PaymentMethodPicker, METHOD_LABEL, type PaymentMethod, useMockProcess } from "@/components/flow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMoney } from "@/lib/format";
import { CheckCircle2, Copy, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";

interface DepositResult {
  amount: number;
  fee: number;
  method: PaymentMethod;
  reference: string;
  createdAt: string;
  bank?: { iban: string; swift: string };
  account?: string;
}
interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onComplete: (payload: DepositResult) => void;
  onViewTransaction?: (reference: string) => void;
}

const STEPS = [
  { key: "amount", label: "المبلغ" },
  { key: "method", label: "الدفع" },
  { key: "review", label: "المراجعة" },
  { key: "done", label: "التأكيد" },
];

const DEPOSIT_METHODS: PaymentMethod[] = ["card", "bank", "applepay", "googlepay"];

export function DepositDialog({ open, onOpenChange, onComplete, onViewTransaction }: Props) {
  const money = useMoney();
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [account, setAccount] = useState("");
  const [iban, setIban] = useState("");
  const [swift, setSwift] = useState("");
  const [amtError, setAmtError] = useState<string | undefined>();
  const [methodError, setMethodError] = useState<string | undefined>();
  const [result, setResult] = useState<DepositResult | null>(null);
  const proc = useMockProcess();

  const numeric = Number(amount || 0);
  const fee = Math.round(numeric * 0.01);
  const total = numeric + fee;

  const close = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep(0); setAmount(""); setAccount(""); setIban(""); setSwift(""); setMethod("card");
      proc.reset(); setAmtError(undefined); setMethodError(undefined); setResult(null);
    }, 300);
  };

  const nextFromAmount = () => {
    if (numeric < 50) return setAmtError("الحد الأدنى للإيداع 50 ج.م");
    if (numeric > 500000) return setAmtError("الحد الأقصى 500,000 ج.م");
    setAmtError(undefined); setStep(1);
  };

  const validateMethod = () => {
    if (method === "card") {
      const digits = account.replace(/\s/g, "");
      if (!/^\d{13,19}$/.test(digits)) return "رقم البطاقة غير صحيح";
    } else if (method === "bank") {
      if (!/^EG\d{2}[A-Z0-9]{20,26}$/i.test(iban.replace(/\s/g, ""))) return "رقم IBAN غير صحيح";
      if (!/^[A-Z0-9]{8,11}$/i.test(swift.replace(/\s/g, ""))) return "SWIFT Code غير صحيح";
    }
    return undefined;
  };

  const nextFromMethod = () => {
    const err = validateMethod();
    if (err) return setMethodError(err);
    setMethodError(undefined); setStep(2);
  };

  const confirm = async () => {
    setStep(3);
    const ok = await proc.run();
    if (!ok) return;
    const payload: DepositResult = {
      amount: numeric, fee, method,
      reference: `DEP-${Date.now().toString().slice(-8)}`,
      createdAt: new Date().toISOString(),
      account: method === "card" ? account : undefined,
      bank: method === "bank" ? { iban, swift } : undefined,
    };
    setResult(payload);
    onComplete(payload);
  };

  return (
    <MultiStepDialog open={open} onOpenChange={(o) => !o && close()} title="إيداع في المحفظة" steps={STEPS} currentStep={Math.min(step, 3)} locked={proc.status === "processing"}>
      {step === 0 && (
        <div>
          <AmountInput value={amount} onChange={setAmount} error={amtError} hint="الرسوم 1% على كل إيداع" min={50} quickPicks={[100, 250, 500, 1000, 5000]} />
          <StepFooter>
            <Button variant="outline" className="flex-1" onClick={close}>إلغاء</Button>
            <Button className="flex-1" onClick={nextFromAmount}>متابعة</Button>
          </StepFooter>
        </div>
      )}
      {step === 1 && (
        <div className="space-y-4">
          <PaymentMethodPicker
            methods={DEPOSIT_METHODS}
            value={method}
            onChange={(m) => { setMethod(m); setMethodError(undefined); }}
            account={account}
            onAccountChange={setAccount}
            hideAccountField={method === "bank"}
            error={method === "card" ? methodError : undefined}
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
              {methodError && <p className="text-xs text-destructive">{methodError}</p>}
            </div>
          )}
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
            {method === "card" && <ReviewRow label="البطاقة" value={<span className="font-mono">•••• {account.slice(-4)}</span>} />}
            {method === "bank" && <>
              <ReviewRow label="IBAN" value={<span className="font-mono text-xs">{iban}</span>} />
              <ReviewRow label="SWIFT" value={<span className="font-mono text-xs">{swift}</span>} />
            </>}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">بمتابعتك فأنت توافق على شروط الخدمة وسياسة الاسترداد.</div>
          <StepFooter>
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>رجوع</Button>
            <Button className="flex-1" onClick={confirm}>تأكيد الإيداع</Button>
          </StepFooter>
        </div>
      )}
      {step === 3 && proc.status === "processing" && <ProcessingStep message="جارٍ التواصل مع مزود الدفع..." />}
      {step === 3 && proc.status === "success" && result && (
        <div className="flex flex-col items-center py-4 gap-4 text-center">
          <div className="size-16 rounded-full bg-success/15 grid place-items-center animate-in zoom-in-50 duration-300">
            <CheckCircle2 className="size-9 text-success" />
          </div>
          <div>
            <div className="font-display text-xl font-bold">تم الإيداع بنجاح</div>
            <div className="text-sm text-muted-foreground mt-1">تمت إضافة الرصيد إلى محفظتك</div>
          </div>
          <div className="w-full rounded-lg border p-3 text-start">
            <ReviewRow label="رقم العملية" value={
              <button className="font-mono inline-flex items-center gap-1 hover:text-primary" onClick={() => { navigator.clipboard.writeText(result.reference); toast.success("تم النسخ"); }}>
                {result.reference} <Copy className="size-3" />
              </button>
            } />
            <ReviewRow label="المبلغ" value={money(result.amount)} emphasis />
            <ReviewRow label="التاريخ" value={<span className="inline-flex items-center gap-1"><CalendarIcon className="size-3" />{new Date(result.createdAt).toLocaleString("ar-EG")}</span>} />
            <ReviewRow label="طريقة الدفع" value={METHOD_LABEL[result.method]} />
          </div>
          <div className="flex gap-2 w-full pt-2">
            <Button variant="outline" className="flex-1" onClick={() => { onViewTransaction?.(result.reference); close(); }}>عرض العملية</Button>
            <Button className="flex-1" onClick={close}>تم</Button>
          </div>
        </div>
      )}
      {step === 3 && proc.status === "error" && (
        <FailureStep message={proc.error ?? undefined} onRetry={confirm} onCancel={close} />
      )}
    </MultiStepDialog>
  );
}
