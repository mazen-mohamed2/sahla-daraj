import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { usePendingListings, useListings } from "@/hooks/queries";
import { formatDate } from "@/services/mock-data";
import { useMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, X, Eye } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

export const Route = createFileRoute("/admin/listings")({ component: ListingsReview });

type Listing = { id: string; title: string; seller: string; price: number; city: string; status: string; createdAt: string; image: string };

function ListingsReview() {
  const money = useMoney();
  const { data: pending, isLoading } = usePendingListings();
  const { data: all } = useListings();
  const [preview, setPreview] = useState<Listing | null>(null);
  const shown = pending && pending.length > 0 ? pending : all?.slice(0, 10);

  const columns: ColumnDef<Listing, unknown>[] = [
    { accessorKey: "title", header: "الإعلان", cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <img src={row.original.image} alt="" className="size-12 rounded-lg object-cover" />
        <div className="min-w-0">
          <div className="font-medium truncate">{row.original.title}</div>
          <div className="text-xs text-muted-foreground">{row.original.id}</div>
        </div>
      </div>
    )},
    { accessorKey: "seller", header: "البائع" },
    { accessorKey: "price", header: "السعر", cell: ({ row }) => <span className="font-semibold">{money(row.original.price)}</span> },
    { accessorKey: "city", header: "المدينة" },
    { accessorKey: "status", header: "الحالة", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "createdAt", header: "التاريخ", cell: ({ row }) => formatDate(row.original.createdAt) },
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" onClick={() => setPreview(row.original)}><Eye className="size-4" /></Button>
        <Button size="icon" variant="ghost" className="text-success" onClick={() => toast.success("تمت الموافقة")}><Check className="size-4" /></Button>
        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => toast.error("تم الرفض")}><X className="size-4" /></Button>
      </div>
    )},
  ];

  return (
    <DashboardLayout title="مراجعة الإعلانات">
      <DataTable columns={columns} data={shown} isLoading={isLoading} searchPlaceholder="ابحث في الإعلانات..." />
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent dir="rtl" className="max-w-2xl">
          <DialogHeader><DialogTitle>{preview?.title}</DialogTitle></DialogHeader>
          {preview && (
            <div className="space-y-4">
              <img src={preview.image} alt="" className="h-64 w-full rounded-lg object-cover" />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">البائع: </span>{preview.seller}</div>
                <div><span className="text-muted-foreground">المدينة: </span>{preview.city}</div>
                <div><span className="text-muted-foreground">السعر: </span>{money(preview.price)}</div>
                <div><span className="text-muted-foreground">التاريخ: </span>{formatDate(preview.createdAt)}</div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => { toast.success("تمت الموافقة"); setPreview(null); }}>موافقة</Button>
                <Button variant="destructive" className="flex-1" onClick={() => { toast.error("تم الرفض"); setPreview(null); }}>رفض</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
