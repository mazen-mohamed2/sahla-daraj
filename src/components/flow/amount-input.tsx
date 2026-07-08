import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  quickPicks?: number[];
  max?: number;
  min?: number;
  error?: string;
  hint?: string;
}

export function AmountInput({
  value, onChange, label = "المبلغ",
  quickPicks = [500, 1000, 5000, 10000], max, min = 0, error, hint,
}: Props) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-2 block">{label}</Label>
        <div className="relative">
          <Input
            inputMode="numeric"
            value={value}
            onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="0"
            className="text-2xl font-bold h-14 pe-16 text-center"
          />
          <span className="absolute end-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">ج.م</span>
        </div>
        {hint && !error && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {quickPicks.map((q) => {
          const disabled = max !== undefined && q > max;
          const active = value === String(q);
          return (
            <button
              key={q}
              type="button"
              disabled={disabled}
              onClick={() => onChange(String(q))}
              className={cn(
                "px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
                active ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted",
                disabled && "opacity-40 cursor-not-allowed",
              )}
            >
              {q.toLocaleString("ar-EG")}
            </button>
          );
        })}
      </div>
      {min > 0 && <p className="text-xs text-muted-foreground">الحد الأدنى: {min.toLocaleString("ar-EG")} ج.م</p>}
    </div>
  );
}
