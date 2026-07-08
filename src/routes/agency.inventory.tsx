import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { useListings } from "@/hooks/queries";
import { formatDate } from "@/services/mock-data";
import { useMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

export const Route = createFileRoute("/agency/inventory")({ component: Inventory });

type L = { id: string; title: string; price: number; status: string; views: number; city: string; createdAt: string; image: string };

function Inventory() {
  const money = useMoney();
  const { data, isLoading } = useListings();

  const cols: ColumnDef<L, unknown>[] = [
    { accessorKey: "title", header: "السيارة", cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <img src={row.original.image} alt="" className="size-12 rounded-lg object-cover" />
        <div><div className="font-medium">{row.original.title}</div><div className="text-xs text-muted-foreground">{row.original.city}</div></div>
      </div>
    )},
    { accessorKey: "price", header: "السعر", cell: ({ row }) => <span className="font-semibold">{money(row.original.price)}</span> },
    { accessorKey: "views", header: "المشاهدات" },
    { accessorKey: "status", header: "الحالة", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "createdAt", header: "التاريخ", cell: ({ row }) => formatDate(row.original.createdAt) },
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex gap-1">
        <Button size="icon" variant="ghost"><Eye className="size-4" /></Button>
        <Button size="icon" variant="ghost"><Pencil className="size-4" /></Button>
        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => toast.warning(`حذف ${row.original.id}`)}><Trash2 className="size-4" /></Button>
      </div>
    )},
  ];

  return (
    <DashboardLayout title="مخزون السيارات">
      <DataTable columns={cols} data={data} isLoading={isLoading} searchPlaceholder="ابحث في المخزون..." />
    </DashboardLayout>
  );
}
