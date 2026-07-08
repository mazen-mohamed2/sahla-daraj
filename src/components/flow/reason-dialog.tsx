import { useState } from "react";
import { MultiStepDialog } from "./multi-step-dialog";
import { ProcessingStep, SuccessStep, FailureStep, ReviewRow, StepFooter } from "./flow-steps";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useMockProcess } from "./use-mock-process";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  reasons: string[];
  minDetails?: number;
  submitLabel?: string;
  destructive?: boolean;
  successTitle?: string;
  successMessage?: string;
  onSubmit: (payload: { reason: string; details: string }) => void | Promise<void>;
}

export function ReasonDialog({
  open, onOpenChange, title, reasons, minDetails = 15,
  submitLabel = "إرسال", destructive, successTitle, successMessage, onSubmit,
}: Props) {
  const [step, setStep] = useState(0); // 0 form, 1 review, 2 processing, 3 result
  const [reason, setReason] = useState(reasons[0]);
  const [details, setDetails] = useState("");
  const proc = useMockProcess();

  const steps = [
    { key: "form", label: "التفاصيل" },
    { key: "review", label: "المراجعة" },
    { key: "done", label: "الإرسال" },
  ];

  const canNext = details.trim().length >= minDetails;

  const close = () => {
    onOpenChange(false);
    setTimeout(() => { setStep(0); setReason(reasons[0]); setDetails(""); proc.reset(); }, 300);
  };

  const submit = async () => {
    setStep(2);
    const ok = await proc.run(async () => { await onSubmit({ reason, details }); });
    setStep(ok ? 3 : 3);
  };

  return (
    <MultiStepDialog
      open={open} onOpenChange={(o) => !o && close()} title={title}
      steps={steps}
      currentStep={step === 3 ? 2 : Math.min(step, 2)}
      locked={proc.status === "processing"}
    >
      {step === 0 && (
        <div className="space-y-3">
          <div>
            <Label>السبب</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{reasons.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>التفاصيل (على الأقل {minDetails} حرف)</Label>
            <Textarea rows={4} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="اشرح باختصار..." />
            <p className="text-xs text-muted-foreground mt-1">{details.trim().length} / {minDetails}</p>
          </div>
          <StepFooter>
            <Button variant="outline" className="flex-1" onClick={close}>إلغاء</Button>
            <Button className="flex-1" disabled={!canNext} onClick={() => setStep(1)}>متابعة</Button>
          </StepFooter>
        </div>
      )}
      {step === 1 && (
        <div>
          <div className="rounded-lg border p-3 space-y-1">
            <ReviewRow label="السبب" value={reason} />
            <ReviewRow label="التفاصيل" value={<span className="whitespace-pre-wrap text-start block">{details}</span>} />
          </div>
          <StepFooter>
            <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>رجوع</Button>
            <Button className={"flex-1 " + (destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "")} onClick={submit}>{submitLabel}</Button>
          </StepFooter>
        </div>
      )}
      {step === 2 && <ProcessingStep />}
      {step === 3 && proc.status === "success" && (
        <SuccessStep title={successTitle ?? "تم الإرسال"} message={successMessage} onPrimary={close} />
      )}
      {step === 3 && proc.status === "error" && (
        <FailureStep message={proc.error ?? undefined} onRetry={submit} onCancel={close} />
      )}
    </MultiStepDialog>
  );
}
