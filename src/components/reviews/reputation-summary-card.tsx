import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "./star-rating";
import { useReceivedReviews } from "@/hooks/reviews";
import { useEscrows } from "@/hooks/escrows";
import { Star, ChevronLeft } from "lucide-react";

/**
 * Small dashboard card summarizing a viewer's own reputation.
 * Clicking navigates to the Reviews page for their role.
 */
export function ReputationSummaryCard({ role }: { role: "user" | "agency" }) {
  const { data: escrows = [] } = useEscrows();
  const escrowIds = useMemo(() => escrows.map((e) => e.id), [escrows]);
  const received = useReceivedReviews(escrowIds, role).filter((r) => r.status === "visible");
  const total = received.length;
  const avg = total ? received.reduce((s, r) => s + r.rating, 0) / total : 0;
  const to = role === "agency" ? "/agency/reviews" : "/user/reviews";

  return (
    <Link to={to} className="block">
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="rounded-lg bg-primary/10 p-3">
            <Star className="size-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">تقييمي</div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold">{total ? avg.toFixed(1) : "—"}</span>
              <span className="text-xs text-muted-foreground">({total} تقييم)</span>
            </div>
            <StarRating value={avg} readOnly size={14} />
          </div>
          <ChevronLeft className="size-4 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}
