import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  onChange,
  size = 18,
  readOnly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readOnly?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(n)}
            className={cn("transition-transform", !readOnly && "hover:scale-110 active:scale-95 cursor-pointer", readOnly && "cursor-default")}
            aria-label={`${n} من 5`}
          >
            <Star
              style={{ width: size, height: size }}
              className={cn(filled ? "fill-warning text-warning" : "text-muted-foreground/40")}
            />
          </button>
        );
      })}
    </div>
  );
}
