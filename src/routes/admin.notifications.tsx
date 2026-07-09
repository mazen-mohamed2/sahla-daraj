import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPage } from "@/components/notifications-page";

export const Route = createFileRoute("/admin/notifications")({
  component: () => <NotificationsPage role="admin" />,
});
