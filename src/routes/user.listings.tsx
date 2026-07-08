import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { useListings, useDeleteListing, useUpdateListingStatus } from "@/hooks/queries";
import { formatDate } from "@/services/mock-data";
import { useMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Rocket } from "lucide-react";
import { toast } from "sonner";
import { BoostDialog, ConfirmDialog } from "@/components/flow";
import type { ColumnDef } from "@tanstack/react-table";

export const Route = createFileRoute("/user/listings")({ component: MyListings });

type L = { id: string; title: string; price: number; status: string; views: number; createdAt: string; image: string };

function MyListings() {
  const money = useMoney();
  const nav = useNavigate();
  const { data, isLoading } = useListings();
  const del = useDeleteListing();
  const upd = useUpdateListingStatus();
  const mine = data?.slice(0, 8);

  const [boost, setBoost] = useState<L | null>(null);
  const [delTarget, setDelTarget] = useState<L | null>(null);

  const cols: ColumnDef<L, unknown>[] = [
    { accessorKey: "title", header: "الإعلان", cell: ({ row }) => (
      <Link to="/user/listings/$id" params={{ id: row.original.id }} className="flex items-center gap-3 hover:text-primary transition-colors">
        <img src={row.original.image} alt="" className="size-12 rounded-lg object-cover" />
        <div className="font-medium underline-offset-4 hover:underline">{row.original.title}</div>
      </Link>
    )},
    { accessorKey: "price", header: "السعر", cell: ({ row }) => <span className="font-semibold">{money(row.original.price)}</span> },
    { accessorKey: "views", header: "المشاهدات" },
    { accessorKey: "status", header: "الحالة", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "createdAt", header: "التاريخ", cell: ({ row }) => formatDate(row.original.createdAt) },
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" title="تعزيز" onClick={() => setBoost(row.original)}><Rocket className="size-4" /></Button>
        <Button size="icon" variant="ghost" title="تعديل" onClick={() => nav({ to: "/user/listings/$id", params: { id: row.original.id } })}><Pencil className="size-4" /></Button>
        <Button size="icon" variant="ghost" title="حذف" className="text-destructive" onClick={() => setDelTarget(row.original)}><Trash2 className="size-4" /></Button>
      </div>
    )},
  ];

  return (
    <DashboardLayout title="إعلاناتي">
      <DataTable columns={cols} data={mine} isLoading={isLoading} searchPlaceholder="ابحث في إعلاناتي..." emptyText="ليس لديك إعلانات بعد" />
      {boost && (
        <BoostDialog open={!!boost} onOpenChange={(o) => !o && setBoost(null)}
          listingTitle={boost.title}
          onSuccess={async () => { await upd.mutateAsync({ id: boost.id, status: "active" }); toast.success("تم تعزيز الإعلان"); }} />
      )}
      {delTarget && (
        <ConfirmDialog open={!!delTarget} onOpenChange={(o) => !o && setDelTarget(null)}
          title={`حذف "${delTarget.title}"`}
          description="سيتم حذف الإعلان نهائياً من المنصة، ولن يظهر للمشترين مرة أخرى."
          destructive
          typeToConfirm="احذف"
          confirmLabel="حذف نهائي"
          onConfirm={async () => { await del.mutateAsync(delTarget.id); toast.success("تم حذف الإعلان"); }}
        />
      )}
    </DashboardLayout>
  );
}
