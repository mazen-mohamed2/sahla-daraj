import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { useListings, useAddListing, useUpdateListing, useDeleteListing } from "@/hooks/queries";
import { formatDate } from "@/services/mock-data";
import { useMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Eye, Plus, Package } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

export const Route = createFileRoute("/agency/inventory")({ component: Inventory });

const MAKES = ["تويوتا","هيونداي","كيا","نيسان","شفروليه","فولكس فاجن","مرسيدس","بي إم دبليو","MG","شيري"];
const CITIES = ["القاهرة","الجيزة","الإسكندرية","الأقصر","أسوان","المنصورة","طنطا"];
const CONDITIONS = ["جديد","ممتاز","جيد","مقبول"];

type L = { id: string; title: string; make: string; model: string; year: number; price: number; status: string; views: number; city: string; createdAt: string; image: string };
type FormData = { make: string; model: string; year: number; color: string; mileage: number; price: number; condition: string; quantity: number; city: string; notes: string };

const empty: FormData = { make: MAKES[0], model: "", year: 2023, color: "أبيض", mileage: 0, price: 0, condition: "ممتاز", quantity: 1, city: CITIES[0], notes: "" };

function Inventory() {
  const money = useMoney();
  const { data, isLoading } = useListings();
  const addListing = useAddListing();
  const updateListing = useUpdateListing();
  const deleteListing = useDeleteListing();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<L | null>(null);
  const [viewTarget, setViewTarget] = useState<L | null>(null);
  const [delTarget, setDelTarget] = useState<L | null>(null);
  const [form, setForm] = useState<FormData>(empty);

  const openEdit = (l: L) => {
    setEditTarget(l);
    setForm({ make: l.make, model: l.model, year: l.year, color: "أبيض", mileage: 0, price: l.price, condition: "ممتاز", quantity: 1, city: l.city, notes: "" });
  };

  const submitAdd = () => {
    if (!form.model.trim() || !form.price) { toast.error("الطراز والسعر مطلوبان"); return; }
    addListing.mutate(
      { title: `${form.make} ${form.model} ${form.year}`, make: form.make, model: form.model, year: form.year, price: form.price, city: form.city, status: "in_stock" },
      { onSuccess: () => { toast.success("✅ تم إضافة السيارة للمخزون"); setAddOpen(false); setForm(empty); } },
    );
  };
  const submitEdit = () => {
    if (!editTarget) return;
    updateListing.mutate(
      { id: editTarget.id, title: `${form.make} ${form.model} ${form.year}`, make: form.make, model: form.model, year: form.year, price: form.price, city: form.city },
      { onSuccess: () => { toast.success("✅ تم تحديث السيارة"); setEditTarget(null); } },
    );
  };
  const submitDelete = () => {
    if (!delTarget) return;
    deleteListing.mutate(delTarget.id, { onSuccess: () => { toast.success("🗑️ تم الحذف"); setDelTarget(null); } });
  };

  const cols: ColumnDef<L, unknown>[] = [
    { accessorKey: "title", header: "السيارة", cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <img src={row.original.image} alt="" className="size-12 rounded-lg object-cover" />
        <div>
          <div className="font-medium">{row.original.title}</div>
          <div className="text-xs text-muted-foreground">{row.original.city}</div>
        </div>
      </div>
    )},
    { accessorKey: "price", header: "السعر", cell: ({ row }) => <span className="font-semibold">{money(row.original.price)}</span> },
    { accessorKey: "views", header: "المشاهدات" },
    { accessorKey: "status", header: "الحالة", cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <StatusBadge status={row.original.status} />
        {row.original.status === "in_stock" && <Badge variant="secondary" className="text-[10px]"><Package className="size-3 ml-0.5" />المخزون</Badge>}
      </div>
    )},
    { accessorKey: "createdAt", header: "التاريخ", cell: ({ row }) => formatDate(row.original.createdAt) },
    { id: "actions", header: "", enableSorting: false, cell: ({ row }) => (
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" onClick={() => setViewTarget(row.original)}><Eye className="size-4" /></Button>
        <Button size="icon" variant="ghost" onClick={() => openEdit(row.original)}><Pencil className="size-4" /></Button>
        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDelTarget(row.original)}><Trash2 className="size-4" /></Button>
      </div>
    )},
  ];

  const headerAction = <Button size="sm" onClick={() => { setForm(empty); setAddOpen(true); }}><Plus className="ml-1 size-4" /> إضافة للمخزون</Button>;

  return (
    <DashboardLayout title="مخزون السيارات" headerAction={headerAction}>
      <DataTable
        columns={cols} data={data} isLoading={isLoading}
        searchPlaceholder="ابحث في المخزون..."
        statusOptions={[
          { value: "active", label: "نشط" },
          { value: "in_stock", label: "بالمخزون" },
          { value: "sold", label: "مباع" },
          { value: "pending", label: "معلق" },
        ]}
      />

      <CarFormDialog
        open={addOpen} onClose={() => setAddOpen(false)}
        title="إضافة سيارة للمخزون" form={form} setForm={setForm}
        onSubmit={submitAdd} loading={addListing.isPending}
      />
      <CarFormDialog
        open={!!editTarget} onClose={() => setEditTarget(null)}
        title="تعديل السيارة" form={form} setForm={setForm}
        onSubmit={submitEdit} loading={updateListing.isPending}
      />

      <Sheet open={!!viewTarget} onOpenChange={(o) => !o && setViewTarget(null)}>
        <SheetContent side="left" dir="rtl" className="w-full sm:max-w-md">
          {viewTarget && (
            <>
              <SheetHeader><SheetTitle>{viewTarget.title}</SheetTitle></SheetHeader>
              <img src={viewTarget.image} alt="" className="mt-4 h-48 w-full rounded-lg object-cover" />
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between border-b pb-1"><span className="text-muted-foreground">السعر</span><span className="font-bold">{money(viewTarget.price)}</span></div>
                <div className="flex justify-between border-b pb-1"><span className="text-muted-foreground">المدينة</span><span>{viewTarget.city}</span></div>
                <div className="flex justify-between border-b pb-1"><span className="text-muted-foreground">المشاهدات</span><span>{viewTarget.views}</span></div>
                <div className="flex justify-between border-b pb-1"><span className="text-muted-foreground">الحالة</span><StatusBadge status={viewTarget.status} /></div>
                <div className="flex justify-between"><span className="text-muted-foreground">التاريخ</span><span>{formatDate(viewTarget.createdAt)}</span></div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!delTarget} onOpenChange={(o) => !o && setDelTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف السيارة</AlertDialogTitle>
            <AlertDialogDescription>هل تريد حذف هذه السيارة من المخزون؟ لا يمكن التراجع.</AlertDialogDescription>
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

function CarFormDialog({ open, onClose, title, form, setForm, onSubmit, loading }: {
  open: boolean; onClose: () => void; title: string;
  form: FormData; setForm: (f: FormData) => void; onSubmit: () => void; loading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl" className="max-w-lg">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>الصانع</Label>
            <Select value={form.make} onValueChange={(v) => setForm({ ...form, make: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{MAKES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>الطراز</Label><Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></div>
          <div>
            <Label>السنة</Label>
            <Select value={String(form.year)} onValueChange={(v) => setForm({ ...form, year: +v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Array.from({ length: 11 }, (_, i) => 2015 + i).map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>اللون</Label><Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
          <div><Label>الممشى (كم)</Label><Input type="number" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: +e.target.value })} /></div>
          <div><Label>السعر (ج.م)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} /></div>
          <div>
            <Label>الحالة</Label>
            <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>الكمية</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: +e.target.value })} /></div>
          <div className="col-span-2">
            <Label>المدينة</Label>
            <Select value={form.city} onValueChange={(v) => setForm({ ...form, city: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2"><Label>ملاحظات</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={onSubmit} disabled={loading}>{loading ? "جارٍ..." : "حفظ"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
