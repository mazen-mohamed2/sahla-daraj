import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star, CheckCircle2 } from "lucide-react";
import { ReviewDialog } from "./review-dialog";
import { useHasReviewed } from "@/hooks/reviews";
import type { Escrow } from "@/services/escrow-data";
import { useAuthStore } from "@/store/auth";

/**
 * Renders a "Leave a review" CTA — but only when the escrow is `released`
 * (per requirement) and the current role has not yet reviewed this escrow.
 */
export function EscrowReviewAction({ escrow, viewerRole }: { escrow: Escrow; viewerRole: "user" | "agency" }) {
  const [open, setOpen] = useState(false);
  const meName = useAuthStore((s) => s.name);
  const mePhone = useAuthStore((s) => s.phone);
  const hasReviewed = useHasReviewed(escrow.id, viewerRole);

  if (escrow.status !== "released") return null;

  const subject =
    viewerRole === "user"
      ? { id: escrow.agencyName, name: escrow.agencyName, role: "agency" as const }
      : { id: escrow.buyerName ?? me.phone, name: escrow.buyerName ?? "المشتري", role: "user" as const };

  if (hasReviewed) {
    return (
      <div className="flex-1 rounded-lg bg-success/10 border border-success/40 p-2 text-xs text-success flex items-center gap-2">
        <CheckCircle2 className="size-3.5" /> شكراً — تم إرسال تقييمك
      </div>
    );
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="flex-1"
        onClick={(ev) => { ev.stopPropagation(); setOpen(true); }}
      >
        <Star className="ml-2 size-4" /> اترك تقييمك
      </Button>
      <ReviewDialog
        open={open}
        onOpenChange={setOpen}
        escrowId={escrow.id}
        reviewer={{ id: me.phone, name: me.name, role: viewerRole }}
        subject={subject}
      />
    </>
  );
}
