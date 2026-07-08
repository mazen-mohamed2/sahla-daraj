import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Smartphone, CreditCard, Building2, Wallet } from "lucide-react";

export type PaymentMethod = "vodafone" | "instapay" | "card" | "fawry" | "bank";

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  vodafone: "فودافون كاش",
  instapay: "إنستاباي",
  card: "بطاقة بنكية",
  fawry: "فوري",
  bank: "تحويل بنكي",
};

const METHOD_ICON: Record<PaymentMethod, React.ComponentType<{ className?: string }>> = {
  vodafone: Smartphone,
  instapay: Smartphone,
  card: CreditCard,
  fawry: Wallet,
  bank: Building2,
};

interface Props {
  value: PaymentMethod;
  onChange: (v: PaymentMethod) => void;
  account: string;
  onAccountChange: (v: string) => void;
  methods?: PaymentMethod[];
  error?: string;
}

export function PaymentMethodPicker({
  value, onChange, account, onAccountChange,
  methods = ["vodafone", "instapay", "card", "fawry"], error,
}: Props) {
  const inputLabel = value === "card" ? "رقم البطاقة" : value === "bank" ? "رقم الحساب / IBAN" : "رقم المحفظة";
  const placeholder = value === "card" ? "0000 0000 0000 0000" : value === "bank" ? "EG00 0000 0000 0000" : "+20 100 000 0000";

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2 block">طريقة الدفع</Label>
        <div className="grid grid-cols-2 gap-2">
          {methods.map((m) => {
            const Icon = METHOD_ICON[m];
            const active = value === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => onChange(m)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border p-3 text-sm transition-all",
                  active ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "hover:bg-muted/40",
                )}
              >
                <Icon className={cn("size-4", active && "text-primary")} />
                <span className="font-medium">{METHOD_LABEL[m]}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <Label>{inputLabel}</Label>
        <Input value={account} onChange={(e) => onAccountChange(e.target.value)} placeholder={placeholder} inputMode={value === "card" ? "numeric" : "tel"} />
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>
    </div>
  );
}
