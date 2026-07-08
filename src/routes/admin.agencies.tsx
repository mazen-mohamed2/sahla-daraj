import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { useAgencyApplications, useUpdateAgencyStatus, useAddAgency } from "@/hooks/queries";
import { formatDate } from "@/services/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Check, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog, ReasonDialog } from "@/components/flow";
import type { ColumnDef } from "@tanstack/react-table";

const REJECT_REASONS = ["وثائق غير مكتملة", "بيانات غير مطابقة", "عدم استيفاء الشروط", "شكاوى سابقة", "أخرى"];

export const Route = createFileRoute("/admin/agencies")({ component: Agencies });

const CITIES = ["القاهرة","الجيزة","الإسكندرية","الأقصر","أسوان","المنصورة","طنطا","الزقازيق","الإسماعيلية","بورسعيد"];

type App = { id: string; name: string; contact: string; phone: string; city: string; vehicles: number; status: string; submittedAt: string };

function Agencies() {
  const { data, isLoading } = useAgencyApplications();
  const updateStatus = useUpdateAgencyStatus();
  const addAgency = useAddAgency();

  const [rejectTarget, setRejectTarget] = useState<App | null>(null);
  const [approveTarget, setApproveTarget] = useState<App | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", contact: "", phone: "", city: "القاهرة", vehicles: 0 });

  const handleAdd = () => {
    if (!form.name.trim() || !form.contact.trim() || !form.phone.trim()) { toast.error("جميع الحقول مطلوبة"); return; }
    addAgency.mutate(form, { onSuccess: () => { toast.success("✅ تم إضافة المعرض"); setAddOpen(false); setForm({ name: "", contact: "", phone: "", city: "القاهرة", vehicles: 0 }); } });
  };

  const columns: ColumnDef<App, unknown>[] = [
    { accessorKey: "name", header: "اسم المعرض", cell: ({ row }) => <span className="font-semibold">{row.original.name}</span> },
    { accessorKey: "contact", header: "المسؤول" },
    { accessorKey: "phone", header: "الجوال" },
    { accessorKey: "city", header: "المدينة" },
    { accessorKey: "vehicles", header: "عدد السيارات" },
    { accessorKey: "status", header: "الحالة", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "submittedAt", header: "تاريخ التقديم", cell: ({ row }) => formatDate(row.original.submittedAt) },
    { id: "actions", header: "", enableSorting: false, cell: ({ row }) => {
      const a = row.original;
      if (a.status !== "pending") return <span className="text-xs text-muted-foreground">—</span>;
      return (
        <div className="flex gap-1">
          <Button size="sm" onClick={() => handleApprove(a)}><Check className="ml-1 size-4" /> اعتماد</Button>
          <Button size="sm" variant="outline" className="text-destructive" onClick={() => setRejectTarget(a)}><X className="ml-1 size-4" /> رفض</Button>
        </div>
      );
    }},
  ];

  const headerAction = (
    <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="ml-1 size-4" /> إضافة معرض</Button>
  );

  return (
    <DashboardLayout title="طلبات اعتماد المعارض" headerAction={headerAction}>
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        searchPlaceholder="ابحث في المعارض..."
        statusOptions={[
          { value: "pending", label: "معلق" },
          { value: "approved", label: "معتمد" },
          { value: "rejected", label: "مرفوض" },
        ]}
      />

      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>رفض المعرض</DialogTitle></DialogHeader>
          <div><Label>سبب الرفض</Label><Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleReject}>تأكيد الرفض</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>إضافة معرض يدوياً</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>اسم المعرض</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>المسؤول</Label><Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></div>
            <div><Label>الجوال</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+20 100 123 4567" /></div>
            <div>
              <Label>المدينة</Label>
              <Select value={form.city} onValueChange={(v) => setForm({ ...form, city: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>عدد السيارات</Label><Input type="number" value={form.vehicles} onChange={(e) => setForm({ ...form, vehicles: +e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>إلغاء</Button>
            <Button onClick={handleAdd}>إضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
