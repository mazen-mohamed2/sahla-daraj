import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "./star-rating";
import { useReputation } from "@/hooks/reviews";
import { formatDate } from "@/services/mock-data";
import { Star, MessageSquare, CheckCircle2 } from "lucide-react";

interface Props {
  /** ID of the reviewee (usually the counterparty display name). */
  revieweeId: string;
  revieweeName?: string;
  /** Optional role scope — keeps buyer & agency reputations separated. */
  revieweeRole?: "user" | "agency";
  completedDeals?: number;
  compact?: boolean;
  maxRecent?: number;
}

export function ReputationBlock({ revieweeId, revieweeName, revieweeRole, completedDeals, compact, maxRecent = 3 }: Props) {
  const { avg, total, reviews } = useReputation(revieweeId, revieweeRole);

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 text-sm">
        <StarRating value={avg} readOnly size={14} />
        <span className="font-semibold">{avg.toFixed(1)}</span>
        <span className="text-muted-foreground">({total})</span>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Stat icon={Star} label="متوسط التقييم" value={total ? avg.toFixed(1) : "—"} />
          <Stat icon={MessageSquare} label="عدد التقييمات" value={String(total)} />
          <Stat icon={CheckCircle2} label="صفقات مكتملة" value={String(completedDeals ?? 0)} />
        </div>
        <StarRating value={avg} readOnly />
        {reviews.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            لا توجد تقييمات بعد{revieweeName ? ` عن ${revieweeName}` : ""}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground">أحدث التقييمات</div>
            {reviews.slice(0, maxRecent).map((r) => (
              <div key={r.id} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{r.reviewerName}</div>
                  <StarRating value={r.rating} readOnly size={13} />
                </div>
                {r.comment && <div className="text-muted-foreground mt-1 leading-relaxed">{r.comment}</div>}
                <div className="text-[11px] text-muted-foreground mt-1">{formatDate(r.createdAt)}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Star; label: string; value: string }) {
  return (
    <div className="rounded-lg border p-2 text-center">
      <Icon className="size-4 mx-auto text-primary" />
      <div className="text-lg font-bold mt-1">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
