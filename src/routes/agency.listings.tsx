import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { useListings, useUpdateListing, useDeleteListing } from "@/hooks/queries";
import { formatDate } from "@/services/mock-data";
import { useMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

export const Route = createFileRoute("/agency/listings")({ component: AgencyListings });

type L = { id: string; title: string; price: number; status: string; views: number; city: string; createdAt: string; image: string };

function AgencyListings() {
  const money = useMoney();
  const nav = useNavigate();
  const { data, isLoading } = useListings();
  const updateListing = useUpdateListing();
  const deleteListing = useDeleteListing();

  const [editTarget, setEditTarget] = useState<L | null>(null);
  const [delTarget, setDelTarget] = useState<L | null>(null);
  const [form, setForm] = useState({ title: "", price: 0, city: "", description: "" });

  const openEdit = (l: L) => {
    setEditTarget(l);
    setForm({ title: l.title, price: l.price, city: l.city, description: "" });
  };
  const submitEdit = () => {
    if (!editTarget) return;
    updateListing.mutate(
      { id: editTarget.id, title: form.title, price: form.price, city: form.city },
      { onSuccess: () => { toast.success("✅ تم التحديث"); setEditTarget(null); } },
    );
  };
  const submitDelete = () => {
    if (!delTarget) return;
    deleteListing.mutate(delTarget.id, { onSuccess: () => { toast.success("🗑️ تم الحذف"); setDelTarget(null); } });
  };

  const cols: ColumnDef<L, unknown>[] = [
    { accessorKey: "title", header: "الإعلان", cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <img src={row.original.image} alt="" className="size-10 rounded-lg object-cover" />
        <span className="font-medium">{row.original.title}</span>
      </div>
    )},
    { accessorKey: "price", header: "السعر", cell: ({ row }) => <span className="font-semibold">{money(row.original.price)}</span> },
    { accessorKey: "status", header: "الحالة", cell: ({ row }) => <StatusBadge status={row.original.status === "pending" ? "review" : row.original.status} /> },
    { accessorKey: "views", header: "المشاهدات" },
    { accessorKey: "city", header: "المدينة" },
    { accessorKey: "createdAt", header: "التاريخ", cell: ({ row }) => formatDate(row.original.createdAt) },
    { id: "actions", header: "", enableSorting: false, cell: ({ row }) => (
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" onClick={() => openEdit(row.original)}><Pencil className="size-4" /></Button>
        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDelTarget(row.original)}><Trash2 className="size-4" /></Button>
      </div>
    )},
  ];

  const headerAction = <Button size="sm" onClick={() => nav({ to: "/agency/add-listing" })}><Plus className="ml-1 size-4" /> إنشاء إعلان</Button>;

  return (
    <DashboardLayout title="إعلاناتي" headerAction={headerAction}>
      <DataTable columns={cols} data={data} isLoading={isLoading} searchPlaceholder="ابحث في الإعلانات..."
        statusOptions={[
          { value: "active", label: "نشط" },
          { value: "pending", label: "قيد المراجعة" },
          { value: "sold", label: "مباع" },
        ]}
      />

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>تعديل الإعلان</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>العنوان</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>السعر</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} /></div>
            <div><Label>المدينة</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div><Label>الوصف</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>إلغاء</Button>
            <Button onClick={submitEdit} disabled={updateListing.isPending}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!delTarget} onOpenChange={(o) => !o && setDelTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الإعلان</AlertDialogTitle>
            <AlertDialogDescription>هل تريد حذف هذا الإعلان؟ لا يمكن التراجع.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={submitDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
