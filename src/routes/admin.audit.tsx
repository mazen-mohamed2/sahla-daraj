import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuditStore, AUDIT_ENTITY_LABELS_AR, type AuditEntry } from "@/store/audit";
import { exportCSV } from "@/lib/csv";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

export const Route = createFileRoute("/admin/audit")({ component: AuditPage });

const ACTION_LABELS_AR: Record<string, string> = {
  ban_user: "حظر مستخدم",
  unban_user: "رفع حظر مستخدم",
  verify_user: "توثيق مستخدم",
  approve_agency: "اعتماد معرض",
  reject_agency: "رفض معرض",
  approve_listing: "اعتماد إعلان",
  reject_listing: "رفض إعلان",
  resolve_dispute: "حل نزاع",
  reject_dispute: "رفض نزاع",
  escalate_dispute: "تصعيد نزاع",
  dispute_resolved: "حل نزاع",
  dispute_rejected: "رفض نزاع",
  dispute_under_review: "بدء مراجعة نزاع",
  force_release_escrow: "إفراج إجباري عن ضمان",
  force_refund_escrow: "استرداد إجباري لضمان",
  withdrawal_approved: "الموافقة على سحب",
  withdrawal_rejected: "رفض سحب",
  approve_kyc: "اعتماد توثيق هوية",
  reject_kyc: "رفض توثيق هوية",
};

const actionLabel = (a: string) => ACTION_LABELS_AR[a] ?? a;

function AuditPage() {
  const entries = useAuditStore((s) => s.entries);
  const clear = useAuditStore((s) => s.clear);
  const [entity, setEntity] = useState<string>("all");
  const [actor, setActor] = useState("");

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (entity !== "all" && e.entity !== entity) return false;
      if (actor.trim() && !e.actor.toLowerCase().includes(actor.toLowerCase())) return false;
      return true;
    });
  }, [entries, entity, actor]);

  const columns: ColumnDef<AuditEntry, unknown>[] = [
    { accessorKey: "createdAt", header: "الوقت", cell: ({ row }) => (
      <span className="tabular-nums text-xs text-muted-foreground">
        {new Date(row.original.createdAt).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" })}
      </span>
    )},
    { accessorKey: "actor", header: "المسؤول", cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{row.original.actor}</span>
        <Badge variant="secondary" className="text-[10px]">{row.original.actorRole === "admin" ? "مدير" : "نظام"}</Badge>
      </div>
    )},
    { accessorKey: "action", header: "الإجراء", cell: ({ row }) => actionLabel(row.original.action) },
    { accessorKey: "entity", header: "الكيان", cell: ({ row }) => (
      <Badge variant="outline">{AUDIT_ENTITY_LABELS_AR[row.original.entity] ?? row.original.entity}</Badge>
    )},
    { accessorKey: "entityId", header: "المعرف", cell: ({ row }) => <span className="font-mono text-xs">{row.original.entityId}</span> },
    { accessorKey: "meta", header: "تفاصيل", cell: ({ row }) => (
      <span className="text-xs text-muted-foreground truncate block max-w-[280px]">{row.original.meta ?? "—"}</span>
    )},
  ];

  const headerAction = (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={() => exportCSV(filtered, "audit-log")}>
        <Download className="ml-1 size-4" /> تصدير CSV
      </Button>
      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => {
        if (confirm("مسح كل سجل الأنشطة؟")) { clear(); toast.success("تم مسح السجل"); }
      }}>
        <Trash2 className="ml-1 size-4" /> مسح السجل
      </Button>
    </div>
  );

  const toolbar = (
    <div className="flex gap-2 items-center">
      <Select value={entity} onValueChange={setEntity}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="الكيان" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">كل الكيانات</SelectItem>
          {Object.entries(AUDIT_ENTITY_LABELS_AR).map(([k, v]) => (
            <SelectItem key={k} value={k}>{v}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input value={actor} onChange={(e) => setActor(e.target.value)} placeholder="تصفية بالمسؤول..." className="w-[200px]" />
    </div>
  );

  return (
    <DashboardLayout title="سجل الأنشطة" headerAction={headerAction}>
      <div className="mb-3 text-sm text-muted-foreground">
        عدد السجلات: <span className="font-bold text-foreground">{filtered.length}</span> من أصل {entries.length}
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="ابحث في السجل..."
        toolbar={toolbar}
      />
    </DashboardLayout>
  );
}
