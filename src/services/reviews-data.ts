// Reviews domain. A review is only creatable once an escrow reaches
// "released" status, and only one review per (escrowId, reviewerRole).
// Storage is the persisted TanStack Query cache — same pattern as escrows.

export interface Review {
  id: string;
  escrowId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: "user" | "agency";
  subjectId: string;      // opaque key — usually the counterparty display name
  subjectName: string;
  subjectRole: "user" | "agency";
  rating: number;         // 1..5
  comment: string;
  createdAt: string;
}

export const REVIEWS_QK = ["reviews"] as const;
