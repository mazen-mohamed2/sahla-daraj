import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { useDisputes, useUpdateDisputeStatus } from "@/hooks/queries";
import { formatDate } from "@/services/mock-data";
import { useMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

export const Route = createFileRoute("/admin/disputes")({ component: Disputes });

type Dispute = { id: string; buyer: string; seller: string; amount: number; reason: string; status: string; note?: string; openedAt: string };

function Disputes() {
  const money = useMoney();
  const { data, isLoading } = useDisputes();
  const updateDispute = useUpdateDisputeStatus();
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (selected && selected.status === "open") {
      updateDispute.mutate({ id: selected.id, status: "in_review" });
      setSelected({ ...selected, status: "in_review" });
    }
    if (selected) setNote(selected.note ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  const columns: ColumnDef<Dispute, unknown>[] = [
    { accessorKey: "id", header: "الرقم" },
    { accessorKey: "buyer", header: "المشتري" },
    { accessorKey: "seller", header: "البائع" },
    { accessorKey: "amount", header: "المبلغ", cell: ({ row }) => <span className="font-semibold">{money(row.original.amount)}</span> },
    { accessorKey: "reason", header: "السبب" },
    { accessorKey: "status", header: "الحالة", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "openedAt", header: "التاريخ", cell: ({ row }) => formatDate(row.original.openedAt) },
    { id: "actions", header: "", enableSorting: false, cell: ({ row }) => (
      <Button size="sm" variant="outline" onClick={() => setSelected(row.original)}>عرض</Button>
    )},
  ];

  const handleResolve = () => {
    if (!selected) return;
    updateDispute.mutate(
      { id: selected.id, status: "resolved", note },
      { onSuccess: () => { toast.success("✅ تم حل النزاع بنجاح"); setSelected(null); } },
    );
  };

  const handleEscalate = () => {
    if (!selected) return;
    if (!note.trim()) { toast.error("الملاحظة مطلوبة عند التصعيد"); return; }
    updateDispute.mutate(
      { id: selected.id, status: "escalated", note },
      { onSuccess: () => { toast.warning("⚠️ تم تصعيد النزاع"); setSelected(null); } },
    );
  };

  return (
    <DashboardLayout title="لوحة النزاعات">
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        searchPlaceholder="ابحث في النزاعات..."
        statusOptions={[
          { value: "open", label: "مفتوح" },
          { value: "in_review", label: "قيد المراجعة" },
          { value: "escalated", label: "مصعّد" },
          { value: "resolved", label: "محلول" },
        ]}
      />
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="left" dir="rtl" className="w-full sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader><SheetTitle>نزاع {selected.id}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="rounded-lg border bg-muted/40 p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">المشتري</span><span>{selected.buyer}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">البائع</span><span>{selected.seller}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">المبلغ</span><span className="font-bold">{money(selected.amount)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">السبب</span><span>{selected.reason}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">الحالة</span><StatusBadge status={selected.status} /></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">تاريخ الفتح</span><span>{formatDate(selected.openedAt)}</span></div>
                </div>

                {selected.status === "escalated" && (
                  <Badge variant="secondary" className="w-full justify-center py-2"><AlertTriangle className="ml-1 size-4" /> تم التصعيد</Badge>
                )}

                {selected.status === "resolved" ? (
                  <div className="rounded-lg border border-success/40 bg-success/10 p-4 text-center">
                    <CheckCircle2 className="mx-auto size-8 text-success" />
                    <p className="mt-2 font-semibold text-success">تم حل هذا النزاع</p>
                    {selected.note && <p className="mt-1 text-xs text-muted-foreground">{selected.note}</p>}
                  </div>
                ) : (
                  <>
                    <div>
                      <Label>ملاحظات القرار {selected.status === "escalated" ? "" : "(مطلوبة للتصعيد)"}</Label>
                      <Textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="أدخل الملاحظات..." className="mt-1" />
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={handleResolve} disabled={updateDispute.isPending}>حل النزاع</Button>
                      {selected.status !== "escalated" && (
                        <Button variant="destructive" className="flex-1" onClick={handleEscalate} disabled={updateDispute.isPending}>تصعيد</Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
