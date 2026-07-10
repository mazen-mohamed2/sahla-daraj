import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./star-rating";
import { useSubmitReview } from "@/hooks/reviews";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  escrowId: string;
  reviewer: { id: string; name: string; role: "user" | "agency" };
  subject: { id: string; name: string; role: "user" | "agency" };
}

export function ReviewDialog({ open, onOpenChange, escrowId, reviewer, subject }: Props) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const submit = useSubmitReview();

  const close = () => {
    onOpenChange(false);
    setTimeout(() => { setRating(5); setComment(""); }, 300);
  };

  const handleSubmit = () => {
    if (rating < 1) { toast.error("اختر تقييمًا من 1 إلى 5"); return; }
    submit.mutate(
      {
        escrowId,
        reviewerId: reviewer.id,
        reviewerName: reviewer.name,
        reviewerRole: reviewer.role,
        subjectId: subject.id,
        subjectName: subject.name,
        subjectRole: subject.role,
        rating,
        comment: comment.trim(),
      },
      {
        onSuccess: () => {
          toast.success("✅ تم إرسال التقييم");
          close();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>تقييم {subject.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>التقييم</Label>
            <div className="mt-2"><StarRating value={rating} onChange={setRating} size={28} /></div>
          </div>
          <div>
            <Label>تعليق (اختياري)</Label>
            <Textarea rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="شارك تجربتك مع الطرف الآخر..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={submit.isPending}>
            {submit.isPending ? "جارٍ الإرسال..." : "إرسال التقييم"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
