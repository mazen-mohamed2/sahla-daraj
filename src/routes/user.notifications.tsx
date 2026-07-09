import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPage } from "@/components/notifications-page";

export const Route = createFileRoute("/user/notifications")({
  component: () => <NotificationsPage role="user" />,
});
