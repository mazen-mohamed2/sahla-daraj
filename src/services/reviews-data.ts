// Reviews domain. A review is only creatable once an escrow reaches
// "released" status, and only one review per (escrowId, reviewerRole).
// Storage is the persisted TanStack Query cache — same pattern as escrows.
//
// Buyer and Agency may EACH submit one review per escrow, they are not
// treated as duplicates of one another.

export type ReviewStatus = "visible" | "hidden" | "reported";

export interface Review {
  id: string;
  escrowId: string;
  vehicle?: string;                 // denormalized for display convenience
  reviewerId: string;
  reviewerName: string;
  reviewerRole: "user" | "agency";
  revieweeId: string;               // opaque key — usually the counterparty display name
  revieweeName: string;
  revieweeRole: "user" | "agency";
  rating: number;                   // 1..5
  comment: string;
  createdAt: string;
  status: ReviewStatus;             // admin can hide / flag inappropriate reviews
}

export const REVIEWS_QK = ["reviews"] as const;

/** Migrate legacy persisted records that used `subject*` field names. */
export function migrateReview(raw: any): Review {
  if (!raw) return raw;
  const revieweeId = raw.revieweeId ?? raw.subjectId ?? "";
  const revieweeName = raw.revieweeName ?? raw.subjectName ?? "";
  const revieweeRole = raw.revieweeRole ?? raw.subjectRole ?? "agency";
  const status: ReviewStatus =
    raw.status === "hidden" ? "hidden"
    : raw.status === "reported" ? "reported"
    : "visible";
  return {
    id: raw.id,
    escrowId: raw.escrowId,
    vehicle: raw.vehicle,
    reviewerId: raw.reviewerId,
    reviewerName: raw.reviewerName,
    reviewerRole: raw.reviewerRole,
    revieweeId,
    revieweeName,
    revieweeRole,
    rating: Number(raw.rating) || 0,
    comment: raw.comment ?? "",
    createdAt: raw.createdAt,
    status,
  };
}
