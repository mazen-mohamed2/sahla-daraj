import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MAP: Record<string, { label: string; cls: string }> = {
  active: { label: "نشط", cls: "bg-success/15 text-success border-success/30" },
  pending: { label: "قيد المراجعة", cls: "bg-warning/20 text-warning-foreground border-warning/40" },
  sold: { label: "مباع", cls: "bg-muted text-muted-foreground border-border" },
  banned: { label: "محظور", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  completed: { label: "مكتمل", cls: "bg-success/15 text-success border-success/30" },
  refunded: { label: "مسترد", cls: "bg-muted text-muted-foreground border-border" },
  open: { label: "مفتوح", cls: "bg-warning/20 text-warning-foreground border-warning/40" },
  in_review: { label: "قيد المراجعة", cls: "bg-primary/15 text-primary border-primary/30" },
  escalated: { label: "مصعّد", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  approved: { label: "معتمد", cls: "bg-success/15 text-success border-success/30" },
  rejected: { label: "مرفوض", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  holding: { label: "محتجز", cls: "bg-warning/20 text-warning-foreground border-warning/40" },
  released: { label: "مفرج", cls: "bg-success/15 text-success border-success/30" },
  disputed: { label: "متنازع", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  bidding: { label: "عروض جارية", cls: "bg-primary/15 text-primary border-primary/30" },
  closed: { label: "مغلق", cls: "bg-muted text-muted-foreground border-border" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = MAP[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
  return <Badge variant="outline" className={cn("font-medium", s.cls)}>{s.label}</Badge>;
}
