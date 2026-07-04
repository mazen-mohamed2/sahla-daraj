import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ChatShell } from "@/components/chat/chat-shell";

export const Route = createFileRoute("/agency/chat")({ component: () => (
  <DashboardLayout title="المحادثات"><ChatShell /></DashboardLayout>
)});
