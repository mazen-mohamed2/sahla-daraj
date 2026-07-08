import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ListingWizard } from "@/components/listing/listing-wizard";
import { useAddListing } from "@/hooks/queries";
import { toast } from "sonner";

export const Route = createFileRoute("/agency/add-listing")({ component: AddListing });

function AddListing() {
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
          toast.success("✅ تم إرسال الإعلان للمراجعة");
          nav({ to: "/agency/listings" });
        },
      },
    );
  };

  return (
    <DashboardLayout title="إضافة إعلان جديد">
      <div className="mb-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-muted-foreground">
        نطاق الأسعار المقترح: 50,000 - 2,000,000 ج.م
      </div>
      <ListingWizard onDone={handleDone} />
    </DashboardLayout>
  );
}
