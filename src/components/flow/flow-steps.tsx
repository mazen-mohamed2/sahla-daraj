import { type ReactNode } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ReviewRow({ label, value, emphasis }: { label: string; value: ReactNode; emphasis?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium text-end", emphasis && "text-lg font-bold text-primary")}>{value}</span>
    </div>
  );
}

export function ProcessingStep({ message = "جارٍ معالجة العملية..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
      <div className="size-16 rounded-full bg-primary/10 grid place-items-center">
        <Loader2 className="size-8 text-primary animate-spin" />
      </div>
      <div>
        <div className="font-semibold">{message}</div>
        <div className="text-sm text-muted-foreground mt-1">قد يستغرق ذلك بضع ثوانٍ...</div>
      </div>
    </div>
  );
}

export function SuccessStep({
  title = "تمت العملية بنجاح",
  message,
  primaryLabel = "تم",
  onPrimary,
  secondaryLabel,
  onSecondary,
}: {
  title?: string; message?: ReactNode; primaryLabel?: string; onPrimary: () => void;
  secondaryLabel?: string; onSecondary?: () => void;
}) {
  return (
    <div className="flex flex-col items-center py-6 gap-4 text-center">
      <div className="size-16 rounded-full bg-success/15 grid place-items-center animate-in zoom-in-50 duration-300">
        <CheckCircle2 className="size-9 text-success" />
      </div>
      <div>
        <div className="font-display text-xl font-bold">{title}</div>
        {message && <div className="text-sm text-muted-foreground mt-2">{message}</div>}
      </div>
      <div className="flex gap-2 w-full pt-2">
        {onSecondary && secondaryLabel && (
          <Button variant="outline" className="flex-1" onClick={onSecondary}>{secondaryLabel}</Button>
        )}
        <Button className="flex-1" onClick={onPrimary}>{primaryLabel}</Button>
      </div>
    </div>
  );
}

export function FailureStep({
  title = "فشلت العملية",
  message,
  onRetry,
  onCancel,
}: { title?: string; message?: ReactNode; onRetry: () => void; onCancel: () => void }) {
  return (
    <div className="flex flex-col items-center py-6 gap-4 text-center">
      <div className="size-16 rounded-full bg-destructive/15 grid place-items-center animate-in zoom-in-50 duration-300">
        <XCircle className="size-9 text-destructive" />
      </div>
      <div>
        <div className="font-display text-xl font-bold">{title}</div>
        {message && <div className="text-sm text-muted-foreground mt-2">{message}</div>}
      </div>
      <div className="flex gap-2 w-full pt-2">
        <Button variant="outline" className="flex-1" onClick={onCancel}>إلغاء</Button>
        <Button className="flex-1" onClick={onRetry}>إعادة المحاولة</Button>
      </div>
    </div>
  );
}

export function StepFooter({ children }: { children: ReactNode }) {
  return <div className="flex gap-2 pt-4 border-t mt-4">{children}</div>;
}
