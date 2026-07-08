import { type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  title, value, icon: Icon, change, tone = "primary",
}: {
  title: string; value: ReactNode; icon: LucideIcon; change?: string;
  tone?: "primary" | "success" | "warning" | "destructive";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning-foreground",
    destructive: "bg-destructive/10 text-destructive",
  }[tone];
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-md animate-in fade-in-0 duration-500">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm text-muted-foreground">{title}</div>
            <div className="mt-2 font-display text-2xl font-bold tracking-tight truncate">{value}</div>
            {change && <div className="mt-1 text-xs text-success">{change}</div>}
          </div>
          <div className={cn("grid size-11 shrink-0 place-items-center rounded-xl transition-transform duration-300 hover:rotate-6", toneClass)}>
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
