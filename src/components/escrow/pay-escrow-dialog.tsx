import { useMemo, useState } from "react";
import { MultiStepDialog, type Step } from "@/components/flow/multi-step-dialog";
import { PaymentMethodPicker, type PaymentMethod } from "@/components/flow/payment-method-picker";
import { ProcessingStep, SuccessStep, FailureStep, ReviewRow, StepFooter } from "@/components/flow/flow-steps";
import { Button } from "@/components/ui/button";
import { useMockProcess } from "@/components/flow/use-mock-process";
import { useMoney } from "@/lib/format";
import { usePayEscrow } from "@/hooks/escrows";
import { useWalletBalance } from "@/hooks/wallet";
import type { Escrow, EscrowPaymentMethod } from "@/services/escrow-data";
import { AlertTriangle, Wallet as WalletIcon } from "lucide-react";

interface Props { open: boolean; onOpenChange: (o: boolean) => void; escrow: Escrow }

// Payment methods the ESCROW payment supports (mapped down to storage enum).
const METHODS: PaymentMethod[] = ["card", "bank", "instapay", "vodafone", "fawry"];

function mapMethod(m: PaymentMethod): EscrowPaymentMethod {
  if (m === "card") return "card";
  if (m === "bank") return "bank";
  if (m === "instapay") return "instapay";
  return "card";
}

export function PayEscrowDialog({ open, onOpenChange, escrow }: Props) {
  const money = useMoney();
  const bal = useWalletBalance();
  const pay = usePayEscrow();
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [useWallet, setUseWallet] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [account, setAccount] = useState("");
  const proc = useMockProcess();

  const total = useMemo(() => escrow.amount + escrow.shippingCost, [escrow]);
  const walletHasEnough = (bal.data?.available ?? 0) >= total;

  const steps: Step[] = [
    { key: "method", label: "طريقة الدفع" },
    { key: "review", label: "المراجعة" },
    { key: "done", label: "الإتمام" },
  ];

  const close = () => {
    onOpenChange(false);
    setTimeout(() => { setStep(0); setMethod("card"); setAccount(""); setUseWallet(false); proc.reset(); }, 300);
  };

  const canContinue = useWallet ? walletHasEnough : (method === "card" ? account.replace(/\s/g, "").length >= 12 : method === "bank" ? account.length >= 6 : method === "fawry" ? true : account.length >= 6);

  const submit = async () => {
    setStep(2);
    const ok = await proc.run(async () => {
      await pay.mutateAsync({ id: escrow.id, method: useWallet ? "wallet" : mapMethod(method) });
    });
    setStep(3);
    void ok;
  };

  return (
    <MultiStepDialog
      open={open}
      onOpenChange={(o) => !o && close()}
      title={`دفع ضمان ${escrow.id}`}
      steps={steps}
      currentStep={step === 3 ? 2 : Math.min(step, 2)}
      locked={proc.status === "processing"}
    >
      {step === 0 && (
        <div className="space-y-3">
          <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-3 flex items-center justify-between">
            <span className="text-sm">إجمالي المبلغ المطلوب</span>
            <span className="font-display text-xl font-bold text-primary">{money(total)}</span>
          </div>

          <button
            type="button"
            onClick={() => walletHasEnough && setUseWallet(true)}
            disabled={!walletHasEnough}
            className={`w-full rounded-lg border p-3 flex items-center gap-3 text-start transition-all ${useWallet ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "hover:bg-muted/40"} disabled:opacity-50`}
          >
            <WalletIcon className="size-5 text-primary" />
            <div className="flex-1">
              <div className="font-medium text-sm">الدفع من المحفظة</div>
              <div className="text-xs text-muted-foreground">الرصيد المتاح: {money(bal.data?.available ?? 0)}</div>
            </div>
            {!walletHasEnough && <span className="text-[11px] text-warning-foreground">الرصيد غير كافٍ</span>}
          </button>

          <div className="text-center text-xs text-muted-foreground">أو ادفع بطريقة أخرى</div>

          <div className={useWallet ? "opacity-40 pointer-events-none" : ""}>
            <PaymentMethodPicker
              value={method}
              onChange={(m) => { setUseWallet(false); setMethod(m); }}
              account={account}
              onAccountChange={setAccount}
              methods={METHODS}
            />
          </div>

          <StepFooter>
            <Button variant="outline" className="flex-1" onClick={close}>إلغاء</Button>
            <Button className="flex-1" disabled={!canContinue} onClick={() => setStep(1)}>متابعة</Button>
          </StepFooter>
        </div>
      )}

      {step === 1 && (
        <div>
          <div className="rounded-lg border p-3 space-y-1">
            <ReviewRow label="السيارة" value={escrow.vehicle} />
            <ReviewRow label="المعرض" value={escrow.agencyName} />
            <ReviewRow label="ثمن السيارة" value={money(escrow.amount)} />
            <ReviewRow label="مصاريف الشحن" value={money(escrow.shippingCost)} />
            <ReviewRow label="طريقة الدفع" value={useWallet ? "المحفظة" : method} />
            <ReviewRow label="الإجمالي" value={money(total)} emphasis />
          </div>
          <div className="mt-3 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs flex gap-2">
            <AlertTriangle className="size-4 shrink-0 text-warning" />
            <span>سيبقى المبلغ محتجزاً في الضمان حتى تؤكد استلام السيارة.</span>
          </div>
          <StepFooter>
            <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>رجوع</Button>
            <Button className="flex-1" onClick={submit}>دفع {money(total)}</Button>
          </StepFooter>
        </div>
      )}

      {step === 2 && <ProcessingStep message="جارٍ معالجة الدفع..." />}
      {step === 3 && proc.status === "success" && (
        <SuccessStep title="تم الدفع بنجاح" message={`تم حجز ${money(total)} في الضمان ${escrow.id}. سيقوم المعرض بشراء وشحن السيارة قريباً.`} onPrimary={close} />
      )}
      {step === 3 && proc.status === "error" && (
        <FailureStep message={proc.error ?? undefined} onRetry={submit} onCancel={close} />
      )}
    </MultiStepDialog>
  );
}
