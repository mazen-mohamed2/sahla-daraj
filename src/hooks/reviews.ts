import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { REVIEWS_QK, migrateReview, type Review } from "@/services/reviews-data";
import { notify } from "@/store/notifications";

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export const useReviews = () => {
  const qc = useQueryClient();
  return useQuery({
    queryKey: REVIEWS_QK,
    queryFn: async () => {
      await delay(120);
      const cached = qc.getQueryData<any[]>(REVIEWS_QK) ?? [];
      return cached.map(migrateReview);
    },
    initialData: () => (qc.getQueryData<any[]>(REVIEWS_QK) ?? []).map(migrateReview),
    staleTime: Infinity,
  });
};

/**
 * Reputation aggregate for a given reviewee (agency/seller or buyer).
 * Optionally filter by `revieweeRole` so buyer and agency reputations are
 * never averaged together.
 */
export function useReputation(
  revieweeId: string | undefined,
  revieweeRole?: "user" | "agency",
) {
  const { data = [] } = useReviews();
  const list = !revieweeId
    ? []
    : data.filter(
        (r) =>
          r.revieweeId === revieweeId &&
          r.status !== "hidden" &&
          (!revieweeRole || r.revieweeRole === revieweeRole),
      );
  const total = list.length;
  const avg = total ? list.reduce((s, r) => s + r.rating, 0) / total : 0;
  return { avg, total, reviews: list };
}

/** Reviews already left on a given escrow (both parties combined). */
export function useEscrowReviews(escrowId: string | undefined) {
  const { data = [] } = useReviews();
  return escrowId ? data.filter((r) => r.escrowId === escrowId) : [];
}

/**
 * Returns the current viewer's own review on this escrow (if any),
 * so we can render a "View Review" affordance after submission.
 */
export function useMyEscrowReview(
  escrowId: string | undefined,
  reviewerRole: "user" | "agency",
): Review | undefined {
  const list = useEscrowReviews(escrowId);
  return list.find((r) => r.reviewerRole === reviewerRole);
}

export const useSubmitReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Omit<Review, "id" | "createdAt" | "status">,
    ) => {
      await delay(400);
      const rev: Review = {
        ...input,
        id: `RV-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        createdAt: new Date().toISOString(),
        status: "visible",
      };
      return rev;
    },
    onSuccess: (rev) => {
      qc.setQueryData<Review[]>(REVIEWS_QK, (old = []) => {
        // dedupe: one review per (escrow, reviewerRole) — buyer & agency stay independent
        const filtered = old.filter(
          (r) => !(r.escrowId === rev.escrowId && r.reviewerRole === rev.reviewerRole),
        );
        return [rev, ...filtered];
      });
      notify(rev.revieweeRole, {
        title: "تقييم جديد",
        message: `${rev.reviewerName} قيّمك بـ ${rev.rating}/5`,
        category: "account",
        priority: "medium",
      });
    },
  });
};

/** Admin-only: hide or unhide a review. Never mutates the rating. */
export const useToggleReviewVisibility = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, hidden }: { id: string; hidden: boolean }) => {
      await delay(200);
      return { id, hidden };
    },
    onSuccess: ({ id, hidden }) => {
      qc.setQueryData<Review[]>(REVIEWS_QK, (old = []) =>
        old.map((r) => (r.id === id ? { ...r, status: hidden ? "hidden" : "visible" } : r)),
      );
    },
  });
};
