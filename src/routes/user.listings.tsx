import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { useListings } from "@/hooks/queries";
import { formatSAR, formatDate } from "@/services/mock-data";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Rocket } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

export const Route = createFileRoute("/user/listings")({ component: MyListings });

type L = { id: string; title: string; price: number; status: string; views: number; createdAt: string; image: string };

function MyListings() {
  const { data, isLoading } = useListings();
  const mine = data?.slice(0, 8);

  const cols: ColumnDef<L, unknown>[] = [
    { accessorKey: "title", header: "الإعلان", cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <img src={row.original.image} alt="" className="size-12 rounded-lg object-cover" />
        <div className="font-medium">{row.original.title}</div>
      </div>
    )},
    { accessorKey: "price", header: "السعر", cell: ({ row }) => <span className="font-semibold">{formatSAR(row.original.price)}</span> },
    { accessorKey: "views", header: "المشاهدات" },
    { accessorKey: "status", header: "الحالة", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "createdAt", header: "التاريخ", cell: ({ row }) => formatDate(row.original.createdAt) },
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" onClick={() => toast.success(`تم تعزيز ${row.original.id}`)}><Rocket className="size-4" /></Button>
        <Button size="icon" variant="ghost"><Pencil className="size-4" /></Button>
        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => toast.warning(`تم حذف ${row.original.id}`)}><Trash2 className="size-4" /></Button>
      </div>
    )},
  ];

  return (
    <DashboardLayout title="إعلاناتي">
      <DataTable columns={cols} data={mine} isLoading={isLoading} searchPlaceholder="ابحث في إعلاناتي..." emptyText="ليس لديك إعلانات بعد" />
    </DashboardLayout>
  );
}
