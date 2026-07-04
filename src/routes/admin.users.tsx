import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { useUsers } from "@/hooks/queries";
import { formatDate } from "@/services/mock-data";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Ban, CheckCircle2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

export const Route = createFileRoute("/admin/users")({ component: UsersPage });

type User = { id: string; name: string; phone: string; role: string; status: string; verified: boolean; joinedAt: string };

function UsersPage() {
  const { data, isLoading } = useUsers();

  const roleLabel: Record<string, string> = { admin: "مدير", agency: "معرض", user: "مستخدم" };

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
    { id: "actions", header: "", cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => toast.info(`عرض ${row.original.name}`)}><Eye className="ml-2 size-4" /> عرض التفاصيل</DropdownMenuItem>
          <DropdownMenuItem onClick={() => toast.success(`تم توثيق ${row.original.name}`)}><CheckCircle2 className="ml-2 size-4" /> توثيق</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onClick={() => toast.warning(`تم حظر ${row.original.name}`)}><Ban className="ml-2 size-4" /> حظر</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )},
  ];

  return (
    <DashboardLayout title="إدارة المستخدمين">
      <DataTable columns={columns} data={data} isLoading={isLoading} searchPlaceholder="ابحث بالاسم أو الجوال..." />
    </DashboardLayout>
  );
}
