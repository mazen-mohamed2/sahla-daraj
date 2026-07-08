import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ListingWizard } from "@/components/listing/listing-wizard";
import { useAddListing } from "@/hooks/queries";
import { toast } from "sonner";

export const Route = createFileRoute("/user/create-listing")({ component: Create });

function Create() {
  const nav = useNavigate();
  const addListing = useAddListing();

  const handleDone = (form?: Record<string, string>) => {
    addListing.mutate(
      {
        title: form ? `${form.make || "سيارة"} ${form.model || ""} ${form.year || ""}`.trim() : "إعلان جديد",
        make: form?.make ?? "",
        model: form?.model ?? "",
        year: form?.year ? Number(form.year) : new Date().getFullYear(),
        price: form?.price ? Number(form.price) : 0,
        city: form?.city ?? "القاهرة",
        status: "pending",
      },
      {
        onSuccess: () => {
          toast.success("✅ تم إرسال إعلانك للمراجعة");
          nav({ to: "/user/listings" });
        },
      },
    );
  };

  return (
    <DashboardLayout title="إنشاء إعلان">
      <ListingWizard onDone={handleDone} />
    </DashboardLayout>
  );
}
