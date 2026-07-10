import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ConfirmDialog, ReasonDialog } from "@/components/flow";
import { useKycStore, KYC_STATUS_LABELS_AR, KYC_STATUS_TONE, type KycRequest } from "@/store/kyc";
import { useAuthStore } from "@/store/auth";
import { audit } from "@/store/audit";
import { notify } from "@/store/notifications";
import { formatDate } from "@/services/mock-data";
import { CheckCircle2, XCircle, Eye, FileText } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/kyc")({ component: KycPage });

const REJECT_REASONS = [
  "الصورة غير واضحة",
  "الملف تالف أو غير مقروء",
  "بيانات الهوية غير متطابقة",
  "الوثيقة منتهية الصلاحية",
  "أخرى",
];

function KycPage() {
  const requests = useKycStore((s) => s.requests);
  const approve = useKycStore((s) => s.approve);
  const reject = useKycStore((s) => s.reject);
  const adminName = useAuthStore((s) => s.name);

  const [detail, setDetail] = useState<KycRequest | null>(null);
  const [approveTarget, setApproveTarget] = useState<KycRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<KycRequest | null>(null);

  const rows = useMemo(() => [...requests].sort((a, b) => (a.status === "pending" ? -1 : 1)), [requests]);

  const columns: ColumnDef<KycRequest, unknown>[] = [
    { accessorKey: "userName", header: "المستخدم", cell: ({ row }) => (
      <div className="min-w-0">
        <div className="font-medium truncate">{row.original.userName}</div>
        <div className="text-xs text-muted-foreground truncate">{row.original.userPhone}</div>
      </div>
    )},
    { accessorKey: "fileName", header: "الوثيقة", cell: ({ row }) => (
      <div className="inline-flex items-center gap-2 text-sm">
        <FileText className="size-4 text-muted-foreground" />
        <span className="truncate">{row.original.fileName}</span>
      </div>
    )},
    { accessorKey: "submittedAt", header: "قُدّم في", cell: ({ row }) => formatDate(row.original.submittedAt) },
    { accessorKey: "status", header: "الحالة", cell: ({ row }) => (
      <Badge variant="outline" className={cn("font-medium", KYC_STATUS_TONE[row.original.status])}>
        {KYC_STATUS_LABELS_AR[row.original.status]}
      </Badge>
    )},
    { id: "actions", header: "", enableSorting: false, cell: ({ row }) => {
      const r = row.original;
      return (
        <div className="flex gap-1 justify-end">
          <Button variant="ghost" size="icon" onClick={() => setDetail(r)}><Eye className="size-4" /></Button>
          {r.status === "pending" && (
            <>
              <Button variant="ghost" size="icon" className="text-success" onClick={() => setApproveTarget(r)}>
                <CheckCircle2 className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setRejectTarget(r)}>
                <XCircle className="size-4" />
              </Button>
            </>
          )}
        </div>
      );
    }},
  ];

  return (
    <DashboardLayout title="توثيق الهوية (KYC)">
      <DataTable
        columns={columns}
        data={rows}
        searchPlaceholder="ابحث بالاسم أو الجوال..."
        statusOptions={[
          { value: "pending", label: "قيد المراجعة" },
          { value: "verified", label: "موثّق" },
          { value: "rejected", label: "مرفوض" },
        ]}
      />

      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent side="left" dir="rtl" className="w-full sm:max-w-md">
          {detail && (
            <>
              <SheetHeader><SheetTitle>{detail.userName}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-3 text-sm">
                <Row k="المعرف" v={detail.id} />
                <Row k="الجوال" v={detail.userPhone} />
                <Row k="الوثيقة" v={detail.fileName} />
                <Row k="الحالة" v={<Badge variant="outline" className={cn("font-medium", KYC_STATUS_TONE[detail.status])}>{KYC_STATUS_LABELS_AR[detail.status]}</Badge>} />
                <Row k="تاريخ التقديم" v={formatDate(detail.submittedAt)} />
                {detail.reviewedAt && <Row k="تاريخ المراجعة" v={formatDate(detail.reviewedAt)} />}
                {detail.reviewedBy && <Row k="راجع بواسطة" v={detail.reviewedBy} />}
                {detail.rejectionReason && <Row k="سبب الرفض" v={detail.rejectionReason} />}
              </div>
              <div className="mt-6 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                معاينة الوثيقة غير متاحة في وضع العرض التجريبي
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {approveTarget && (
        <ConfirmDialog
          open={!!approveTarget}
          onOpenChange={(o) => !o && setApproveTarget(null)}
          title={`توثيق ${approveTarget.userName}`}
          description="سيصبح المستخدم موثّقاً ويظهر بجانب اسمه علامة التوثيق."
          confirmLabel="اعتماد التوثيق"
          onConfirm={async () => {
            approve(approveTarget.id, adminName);
            audit({ action: "approve_kyc", entity: "kyc", entityId: approveTarget.id, meta: approveTarget.userName });
            notify("user", { title: "تم توثيق حسابك", message: "تمت الموافقة على طلب توثيق الهوية", category: "account", relatedEntityType: "kyc", actionUrl: "/user/profile", priority: "high" });
            notify("admin", { title: "توثيق مستخدم", message: `تم توثيق ${approveTarget.userName}`, category: "account", relatedEntityType: "kyc", relatedEntityId: approveTarget.id, actionUrl: "/admin/kyc", priority: "low" });
            toast.success(`✅ تم توثيق ${approveTarget.userName}`);
            setApproveTarget(null);
          }}
        />
      )}
      {rejectTarget && (
        <ReasonDialog
          open={!!rejectTarget}
          onOpenChange={(o) => !o && setRejectTarget(null)}
          title={`رفض توثيق ${rejectTarget.userName}`}
          reasons={REJECT_REASONS}
          submitLabel="رفض التوثيق"
          destructive
          successTitle="تم رفض طلب التوثيق"
          onSubmit={async ({ reason, details }) => {
            const fullReason = `${reason} — ${details}`;
            reject(rejectTarget.id, adminName, fullReason);
            audit({ action: "reject_kyc", entity: "kyc", entityId: rejectTarget.id, meta: fullReason });
            notify("user", { title: "تم رفض طلب التوثيق", message: fullReason, category: "account", relatedEntityType: "kyc", actionUrl: "/user/profile", priority: "high" });
            notify("admin", { title: "رفض توثيق", message: `${rejectTarget.userName} — ${reason}`, category: "account", relatedEntityType: "kyc", relatedEntityId: rejectTarget.id, actionUrl: "/admin/kyc", priority: "low" });
            toast.warning(`تم رفض توثيق ${rejectTarget.userName}`);
          }}
        />
      )}
    </DashboardLayout>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b pb-2 gap-4">
      <span className="text-muted-foreground shrink-0">{k}</span>
      <span className="font-medium text-end min-w-0 truncate">{v}</span>
    </div>
  );
}
