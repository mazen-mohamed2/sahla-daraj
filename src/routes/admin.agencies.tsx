import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DataTable } from "@/components/data-table";
import { useAgencyApplications } from "@/hooks/queries";
import { formatDate } from "@/services/mock-data";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

export const Route = createFileRoute("/admin/agencies")({ component: Agencies });

type App = { id: string; name: string; contact: string; phone: string; city: string; vehicles: number; submittedAt: string };

function Agencies() {
  const { data, isLoading } = useAgencyApplications();

  const columns: ColumnDef<App, unknown>[] = [
    { accessorKey: "name", header: "اسم المعرض", cell: ({ row }) => <span className="font-semibold">{row.original.name}</span> },
    { accessorKey: "contact", header: "المسؤول" },
    { accessorKey: "phone", header: "الجوال" },
    { accessorKey: "city", header: "المدينة" },
    { accessorKey: "vehicles", header: "عدد السيارات" },
    { accessorKey: "submittedAt", header: "تاريخ التقديم", cell: ({ row }) => formatDate(row.original.submittedAt) },
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex gap-1">
        <Button size="sm" onClick={() => toast.success(`تم اعتماد ${row.original.name}`)}><Check className="ml-1 size-4" /> اعتماد</Button>
        <Button size="sm" variant="outline" className="text-destructive" onClick={() => toast.error(`تم رفض ${row.original.name}`)}><X className="ml-1 size-4" /> رفض</Button>
      </div>
    )},
  ];

  return (
    <DashboardLayout title="طلبات اعتماد المعارض">
      <DataTable columns={columns} data={data} isLoading={isLoading} searchPlaceholder="ابحث في المعارض..." />
    </DashboardLayout>
  );
}
