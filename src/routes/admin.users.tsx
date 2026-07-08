import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { useUsers, useUpdateUserStatus, useAddUser } from "@/hooks/queries";
import { formatDate } from "@/services/mock-data";
import { exportCSV } from "@/lib/csv";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Ban, CheckCircle2, Eye, UserPlus, Download, Unlock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ConfirmDialog, ReasonDialog } from "@/components/flow";
import type { ColumnDef } from "@tanstack/react-table";

export const Route = createFileRoute("/admin/users")({ component: UsersPage });

const CITIES = ["القاهرة","الجيزة","الإسكندرية","الأقصر","أسوان","المنصورة","طنطا","الزقازيق","الإسماعيلية","بورسعيد"];
const BAN_REASONS = ["نشاط احتيالي مشتبه به", "انتهاك شروط الاستخدام", "إعلانات مزيفة", "تعليقات مسيئة", "أخرى"];

type User = { id: string; name: string; phone: string; role: string; status: string; verified: boolean; joinedAt: string };

function UsersPage() {
  const { data, isLoading } = useUsers();
  const updateStatus = useUpdateUserStatus();
  const addUser = useAddUser();

  const [addOpen, setAddOpen] = useState(false);
  const [detail, setDetail] = useState<User | null>(null);
  const [verifyTarget, setVerifyTarget] = useState<User | null>(null);
  const [unbanTarget, setUnbanTarget] = useState<User | null>(null);
  const [banTarget, setBanTarget] = useState<User | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", role: "user", city: "القاهرة" });

  const roleLabel: Record<string, string> = { admin: "مدير", agency: "معرض", user: "مستخدم" };

  const handleAdd = () => {
    if (!form.name.trim() || !form.phone.trim()) { toast.error("الاسم والهاتف مطلوبان"); return; }
    addUser.mutate(
      { name: form.name, phone: form.phone, role: form.role as "user" | "agency" | "admin", status: "active" },
      {
        onSuccess: () => {
          toast.success("✅ تم إضافة المستخدم");
          setAddOpen(false);
          setForm({ name: "", phone: "", role: "user", city: "القاهرة" });
        },
      },
    );
  };


  const columns: ColumnDef<User, unknown>[] = [
    { accessorKey: "name", header: "الاسم", cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{row.original.name}</span>
        {row.original.verified && <CheckCircle2 className="size-4 text-primary" />}
      </div>
    )},
    { accessorKey: "phone", header: "الجوال" },
    { accessorKey: "role", header: "الدور", cell: ({ row }) => <Badge variant="secondary">{roleLabel[row.original.role]}</Badge> },
    { accessorKey: "status", header: "الحالة", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "joinedAt", header: "تاريخ الانضمام", cell: ({ row }) => formatDate(row.original.joinedAt) },
    { id: "actions", header: "", enableSorting: false, cell: ({ row }) => {
      const u = row.original;
      const isBanned = u.status === "banned";
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setDetail(u)}><Eye className="ml-2 size-4" /> عرض التفاصيل</DropdownMenuItem>
            {!u.verified && (
              <DropdownMenuItem onClick={() => setVerifyTarget(u)}>
                <CheckCircle2 className="ml-2 size-4" /> توثيق
              </DropdownMenuItem>
            )}
            {isBanned ? (
              <DropdownMenuItem onClick={() => setUnbanTarget(u)}>
                <Unlock className="ml-2 size-4" /> رفع الحظر
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem className="text-destructive" onClick={() => setBanTarget(u)}>
                <Ban className="ml-2 size-4" /> حظر
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }},
  ];

  const headerAction = (
    <Button size="sm" onClick={() => setAddOpen(true)}>
      <UserPlus className="ml-1 size-4" /> إضافة مستخدم
    </Button>
  );

  const toolbar = (
    <Button size="sm" variant="outline" onClick={() => data && exportCSV(data, "users")}>
      <Download className="ml-1 size-4" /> تصدير CSV
    </Button>
  );

  return (
    <DashboardLayout title="إدارة المستخدمين" headerAction={headerAction}>
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        searchPlaceholder="ابحث بالاسم أو الجوال..."
        toolbar={toolbar}
        statusOptions={[
          { value: "active", label: "نشط" },
          { value: "banned", label: "محظور" },
          { value: "pending", label: "معلق" },
        ]}
      />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>إضافة مستخدم جديد</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>الاسم</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="محمد أحمد" /></div>
            <div><Label>الجوال</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+20 100 123 4567" /></div>
            <div>
              <Label>الدور</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">مستخدم</SelectItem>
                  <SelectItem value="agency">معرض</SelectItem>
                  <SelectItem value="admin">مدير</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>المدينة</Label>
              <Select value={form.city} onValueChange={(v) => setForm({ ...form, city: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>إلغاء</Button>
            <Button onClick={handleAdd} disabled={addUser.isPending}>{addUser.isPending ? "جارٍ..." : "إضافة"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent side="left" dir="rtl" className="w-full sm:max-w-md">
          {detail && (
            <>
              <SheetHeader><SheetTitle>{detail.name}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-3 text-sm">
                <Row k="المعرف" v={detail.id} />
                <Row k="الجوال" v={detail.phone} />
                <Row k="الدور" v={roleLabel[detail.role]} />
                <Row k="الحالة" v={<StatusBadge status={detail.status} />} />
                <Row k="موثق" v={detail.verified ? "نعم" : "لا"} />
                <Row k="الانضمام" v={formatDate(detail.joinedAt)} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b pb-2">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
