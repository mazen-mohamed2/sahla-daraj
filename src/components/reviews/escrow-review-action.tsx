import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star, Eye } from "lucide-react";
import { ReviewDialog } from "./review-dialog";
import { ReviewViewDialog } from "./review-view-dialog";
import { useMyEscrowReview } from "@/hooks/reviews";
import type { Escrow } from "@/services/escrow-data";
import { useAuthStore } from "@/store/auth";

/**
 * Escrow-scoped review CTA.
 * - Only rendered when escrow.status === "released".
 * - Button label identifies WHO is being reviewed.
 * - Once submitted, swaps to a "View Review" affordance.
 */
export function EscrowReviewAction({
  escrow,
  viewerRole,
  autoOpen = false,
  onAutoOpenConsumed,
}: {
  escrow: Escrow;
  viewerRole: "user" | "agency";
  /** When true, opens the review dialog once on mount (post delivery-confirmation). */
  autoOpen?: boolean;
  onAutoOpenConsumed?: () => void;
}) {
  const meName = useAuthStore((s) => s.name);
  const mePhone = useAuthStore((s) => s.phone);
  const existing = useMyEscrowReview(escrow.id, viewerRole);
  const [open, setOpen] = useState(autoOpen);
  const [viewOpen, setViewOpen] = useState(false);

  if (escrow.status !== "released") return null;

  // reviewee = the OTHER party
  const reviewee =
    viewerRole === "user"
      ? {
          id: escrow.agencyId || escrow.agencyName,
          name: escrow.agencyName,
          role: "agency" as const,
        }
      : {
          id: escrow.buyerId || escrow.buyerName || mePhone,
          name: escrow.buyerName || "المشتري",
          role: "user" as const,
        };

  const buttonLabel =
    viewerRole === "user"
      ? `قيّم المعرض: ${reviewee.name}`
      : `قيّم المشتري: ${reviewee.name}`;

  if (existing) {
    return (
      <>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={(ev) => { ev.stopPropagation(); setViewOpen(true); }}
        >
          <Eye className="ml-2 size-4" /> عرض تقييمك
        </Button>
        <ReviewViewDialog open={viewOpen} onOpenChange={setViewOpen} review={existing} />
      </>
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
        <Star className="ml-2 size-4" /> {buttonLabel}
      </Button>
      <ReviewDialog
        open={open}
        onOpenChange={(o) => { setOpen(o); if (!o) onAutoOpenConsumed?.(); }}
        escrowId={escrow.id}
        vehicle={escrow.vehicle}
        reviewer={{ id: mePhone, name: meName, role: viewerRole }}
        reviewee={reviewee}
        onSubmitted={onAutoOpenConsumed}
      />
    </>
  );
}
