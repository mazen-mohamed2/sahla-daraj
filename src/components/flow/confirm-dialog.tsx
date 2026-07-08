import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useMockProcess } from "./use-mock-process";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  typeToConfirm?: string; // if set, user must type this string to enable confirm
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  open, onOpenChange, title, description,
  confirmLabel = "تأكيد", destructive, typeToConfirm, onConfirm,
}: Props) {
  const [typed, setTyped] = useState("");
  const proc = useMockProcess();
  const canConfirm = !typeToConfirm || typed.trim() === typeToConfirm;

  const handle = async () => {
    const ok = await proc.run(async () => { await onConfirm(); });
    if (ok) {
      onOpenChange(false);
      setTimeout(() => { proc.reset(); setTyped(""); }, 300);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (proc.status === "processing") return; if (!o) { setTyped(""); proc.reset(); } onOpenChange(o); }}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {typeToConfirm && (
          <div className="space-y-1">
            <Label className="text-xs">اكتب <span className="font-mono font-bold text-destructive">{typeToConfirm}</span> للتأكيد</Label>
            <Input value={typed} onChange={(e) => setTyped(e.target.value)} disabled={proc.status === "processing"} />
          </div>
        )}
        {proc.status === "error" && <p className="text-sm text-destructive">{proc.error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={proc.status === "processing"}>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            disabled={!canConfirm || proc.status === "processing"}
            onClick={(e) => { e.preventDefault(); handle(); }}
            className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
          >
            {proc.status === "processing" ? (<><Loader2 className="ml-2 size-4 animate-spin" /> جارٍ التنفيذ</>) : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
