import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { REVIEWS_QK, type Review } from "@/services/reviews-data";
import { notify } from "@/store/notifications";

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export const useReviews = () => {
  const qc = useQueryClient();
  return useQuery({
    queryKey: REVIEWS_QK,
    queryFn: async () => {
      await delay(150);
      return qc.getQueryData<Review[]>(REVIEWS_QK) ?? [];
    },
    initialData: () => qc.getQueryData<Review[]>(REVIEWS_QK) ?? [],
    staleTime: Infinity,
  });
};

/** Reputation aggregate for a given subject (agency/seller name). */
export function useReputation(subjectId: string | undefined) {
  const { data = [] } = useReviews();
  const list = subjectId ? data.filter((r) => r.subjectId === subjectId) : [];
  const total = list.length;
  const avg = total ? list.reduce((s, r) => s + r.rating, 0) / total : 0;
  return { avg, total, reviews: list };
}

/** Reviews already left on a given escrow. */
export function useEscrowReviews(escrowId: string | undefined) {
  const { data = [] } = useReviews();
  return escrowId ? data.filter((r) => r.escrowId === escrowId) : [];
}

/** True when the given role has already reviewed this escrow. */
export function useHasReviewed(escrowId: string | undefined, reviewerRole: "user" | "agency") {
  const existing = useEscrowReviews(escrowId);
  return existing.some((r) => r.reviewerRole === reviewerRole);
}

export const useSubmitReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<Review, "id" | "createdAt">) => {
      await delay(400);
      const rev: Review = {
        ...input,
        id: `RV-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        createdAt: new Date().toISOString(),
      };
      return rev;
    },
    onSuccess: (rev) => {
      qc.setQueryData<Review[]>(REVIEWS_QK, (old = []) => {
        // dedupe: one review per (escrow, reviewerRole)
        const filtered = old.filter((r) => !(r.escrowId === rev.escrowId && r.reviewerRole === rev.reviewerRole));
        return [rev, ...filtered];
      });
      notify(rev.subjectRole, {
        title: "تقييم جديد",
        message: `${rev.reviewerName} قيّمك بـ ${rev.rating}/5`,
        category: "account",
        priority: "medium",
      });
    },
  });
};
