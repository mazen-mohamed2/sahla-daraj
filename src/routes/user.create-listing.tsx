import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ListingWizard } from "@/components/listing/listing-wizard";

export const Route = createFileRoute("/user/create-listing")({ component: Create });
function Create() {
  const nav = useNavigate();
  return <DashboardLayout title="إنشاء إعلان"><ListingWizard onDone={() => nav({ to: "/user/listings" })} /></DashboardLayout>;
}
