import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StarRating } from "./star-rating";
import { formatDate } from "@/services/mock-data";
import type { Review } from "@/services/reviews-data";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  review: Review | null;
}

export function ReviewViewDialog({ open, onOpenChange, review }: Props) {
  if (!review) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>تقييمك</DialogTitle>
          <DialogDescription>
            {review.revieweeRole === "agency"
              ? `تقييمك للمعرض / البائع: ${review.revieweeName}`
              : `تقييمك للمشتري: ${review.revieweeName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <Row label="التقييم"><StarRating value={review.rating} readOnly /></Row>
          <Row label="التعليق">
            <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap min-h-6">
              {review.comment || <span className="italic">— بدون تعليق —</span>}
            </div>
          </Row>
          <Row label="التاريخ"><span>{formatDate(review.createdAt)}</span></Row>
          <Row label="رقم الضمان"><span className="font-mono text-xs">{review.escrowId}</span></Row>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-start gap-3 border-b pb-2 last:border-b-0">
      <div className="text-xs font-semibold text-muted-foreground">{label}</div>
      <div>{children}</div>
    </div>
  );
}
