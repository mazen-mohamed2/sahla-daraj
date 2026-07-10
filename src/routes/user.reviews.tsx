import { createFileRoute } from "@tanstack/react-router";
import { ReviewsPage } from "@/components/reviews/reviews-page";

export const Route = createFileRoute("/user/reviews")({
  component: () => <ReviewsPage role="user" title="تقييماتي" />,
});
