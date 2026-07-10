import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { REVIEWS_QK, migrateReview, type Review, type ReviewStatus } from "@/services/reviews-data";
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
 * never averaged together. Hidden/reported reviews are excluded from
 * public aggregates.
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
          r.status === "visible" &&
          (!revieweeRole || r.revieweeRole === revieweeRole),
      );
  const total = list.length;
  const avg = total ? list.reduce((s, r) => s + r.rating, 0) / total : 0;
  // rating distribution 5..1
  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of list) {
    const k = Math.max(1, Math.min(5, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    distribution[k]++;
  }
  return { avg, total, reviews: list, distribution };
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

/** Reviews received across many escrows (used by /user/reviews & /agency/reviews). */
export function useReceivedReviews(escrowIds: string[], myRole: "user" | "agency") {
  const { data = [] } = useReviews();
  const set = new Set(escrowIds);
  return data.filter((r) => set.has(r.escrowId) && r.reviewerRole !== myRole);
}

/** Reviews I have written across many escrows. */
export function useGivenReviews(escrowIds: string[], myRole: "user" | "agency") {
  const { data = [] } = useReviews();
  const set = new Set(escrowIds);
  return data.filter((r) => set.has(r.escrowId) && r.reviewerRole === myRole);
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
      const stars = "★".repeat(rev.rating) + "☆".repeat(5 - rev.rating);
      const actionUrl = rev.revieweeRole === "agency" ? "/agency/reviews" : "/user/reviews";
      notify(rev.revieweeRole, {
        title: "تقييم جديد",
        message: `${rev.reviewerName} قيّمك ${stars}`,
        category: "account",
        relatedEntityType: "escrow",
        relatedEntityId: rev.escrowId,
        actionUrl,
        actor: rev.reviewerName,
        priority: "medium",
      });
    },
  });
};

/** Admin-only: change review moderation status (visible / hidden / reported). */
export const useSetReviewStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ReviewStatus }) => {
      await delay(200);
      return { id, status };
    },
    onSuccess: ({ id, status }) => {
      qc.setQueryData<Review[]>(REVIEWS_QK, (old = []) =>
        old.map((r) => (r.id === id ? { ...r, status } : r)),
      );
    },
  });
};

/** Back-compat with the old hide/show call site. */
export const useToggleReviewVisibility = () => {
  const set = useSetReviewStatus();
  return {
    ...set,
    mutate: ({ id, hidden }: { id: string; hidden: boolean }) =>
      set.mutate({ id, status: hidden ? "hidden" : "visible" }),
  };
};
