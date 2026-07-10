import { createFileRoute } from "@tanstack/react-router";
import { ReviewsPage } from "@/components/reviews/reviews-page";

export const Route = createFileRoute("/agency/reviews")({
  component: () => <ReviewsPage role="agency" title="تقييمات المعرض" />,
});
