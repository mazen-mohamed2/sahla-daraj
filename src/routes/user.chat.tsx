import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ChatShell } from "@/components/chat/chat-shell";
import { z } from "zod";

const searchSchema = z.object({ c: z.string().optional() });

export const Route = createFileRoute("/user/chat")({
  validateSearch: (s) => searchSchema.parse(s),
  component: () => (
    <DashboardLayout title="المحادثات"><ChatShell /></DashboardLayout>
  ),
});
