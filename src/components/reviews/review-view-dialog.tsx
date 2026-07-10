import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "./star-rating";
import { formatDate } from "@/services/mock-data";
import type { Review } from "@/services/reviews-data";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  review: Review | null;
  /** Optional: viewer perspective. If provided and matches reviewerRole,
   *  the header calls it "Your review"; otherwise "Review received". */
  viewerRole?: "user" | "agency";
}

export function ReviewViewDialog({ open, onOpenChange, review, viewerRole }: Props) {
  if (!review) return null;
  const mine = viewerRole && viewerRole === review.reviewerRole;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{mine ? "تقييمك" : "تفاصيل التقييم"}</DialogTitle>
            {review.status === "hidden" && <Badge variant="secondary">مخفي</Badge>}
            {review.status === "reported" && <Badge variant="destructive">مُبلَّغ عنه</Badge>}
          </div>
          <DialogDescription>
            {review.revieweeRole === "agency"
              ? `تقييم للمعرض / البائع: ${review.revieweeName}`
              : `تقييم للمشتري: ${review.revieweeName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <Row label="المُقيِّم">
            <div>
              <div className="font-medium">{review.reviewerName}</div>
              <div className="text-xs text-muted-foreground">
                {review.reviewerRole === "agency" ? "معرض / بائع" : "مشتري"}
              </div>
            </div>
          </Row>
          <Row label="الطرف المُقَيَّم">
            <div>
              <div className="font-medium">{review.revieweeName}</div>
              <div className="text-xs text-muted-foreground">
                {review.revieweeRole === "agency" ? "معرض / بائع" : "مشتري"}
              </div>
            </div>
          </Row>
          <Row label="التقييم"><StarRating value={review.rating} readOnly /></Row>
          <Row label="التعليق">
            <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap min-h-6">
              {review.comment || <span className="italic">— بدون تعليق —</span>}
            </div>
          </Row>
          {review.vehicle && <Row label="السيارة"><span>{review.vehicle}</span></Row>}
          <Row label="رقم الضمان"><span className="font-mono text-xs">{review.escrowId}</span></Row>
          <Row label="التاريخ"><span>{formatDate(review.createdAt)}</span></Row>
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
