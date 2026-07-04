import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ListingWizard } from "@/components/listing/listing-wizard";

export const Route = createFileRoute("/agency/add-listing")({ component: AddListing });

function AddListing() {
  const nav = useNavigate();
  return (
    <DashboardLayout title="إضافة إعلان جديد">
      <ListingWizard onDone={() => nav({ to: "/agency/inventory" })} />
    </DashboardLayout>
  );
}
