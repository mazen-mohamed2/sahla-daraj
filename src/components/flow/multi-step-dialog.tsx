import { type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface Step {
  key: string;
  label: string;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  steps: Step[];
  currentStep: number;
  locked?: boolean; // when true, prevent closing (e.g. during processing)
  children: ReactNode;
  className?: string;
}

export function MultiStepDialog({ open, onOpenChange, title, steps, currentStep, locked, children, className }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (locked) return; onOpenChange(o); }}>
      <DialogContent
        dir="rtl"
        className={cn("sm:max-w-lg", className)}
        onInteractOutside={(e) => { if (locked) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (locked) e.preventDefault(); }}
      >
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
        </DialogHeader>
        <StepIndicator steps={steps} current={currentStep} />
        <div className="pt-2 min-h-[220px] animate-in fade-in-50 duration-200">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

function StepIndicator({ steps, current }: { steps: Step[]; current: number }) {
  return (
    <div className="flex items-center gap-2 w-full">
      {steps.map((s, i) => {
        const state = i < current ? "done" : i === current ? "active" : "todo";
        return (
          <div key={s.key} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className={cn(
              "flex items-center gap-2 min-w-0",
              state === "todo" && "opacity-50",
            )}>
              <div className={cn(
                "size-6 shrink-0 grid place-items-center rounded-full border text-[11px] font-bold transition-colors",
                state === "done" && "bg-primary text-primary-foreground border-primary",
                state === "active" && "border-primary text-primary",
                state === "todo" && "border-muted-foreground/30 text-muted-foreground",
              )}>
                {state === "done" ? <Check className="size-3" /> : i + 1}
              </div>
              <span className={cn("text-xs truncate", state === "active" && "font-semibold text-foreground")}>{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className="h-px flex-1 bg-border" />}
          </div>
        );
      })}
    </div>
  );
}
