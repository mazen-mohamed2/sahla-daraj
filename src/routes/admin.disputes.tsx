import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { useDisputes } from "@/hooks/queries";
import { formatDate } from "@/services/mock-data";
import { useMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

export const Route = createFileRoute("/admin/disputes")({ component: Disputes });

type Dispute = { id: string; buyer: string; seller: string; amount: number; reason: string; status: string; openedAt: string };

function Disputes() {
  const money = useMoney();
  const { data, isLoading } = useDisputes();
  const [selected, setSelected] = useState<Dispute | null>(null);

  const columns: ColumnDef<Dispute, unknown>[] = [
    { accessorKey: "id", header: "الرقم" },
    { accessorKey: "buyer", header: "المشتري" },
    { accessorKey: "seller", header: "البائع" },
    { accessorKey: "amount", header: "المبلغ", cell: ({ row }) => <span className="font-semibold">{money(row.original.amount)}</span> },
    { accessorKey: "reason", header: "السبب" },
    { accessorKey: "status", header: "الحالة", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "openedAt", header: "التاريخ", cell: ({ row }) => formatDate(row.original.openedAt) },
    { id: "actions", header: "", cell: ({ row }) => (
      <Button size="sm" variant="outline" onClick={() => setSelected(row.original)}>عرض</Button>
    )},
  ];

  return (
    <DashboardLayout title="لوحة النزاعات">
      <DataTable columns={columns} data={data} isLoading={isLoading} searchPlaceholder="ابحث في النزاعات..." />
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
                </div>
                <div>
                  <Label>ملاحظات القرار</Label>
                  <Textarea rows={4} placeholder="أدخل الملاحظات..." className="mt-1" />
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => { toast.success("تم حل النزاع"); setSelected(null); }}>حل</Button>
                  <Button variant="destructive" className="flex-1" onClick={() => { toast.warning("تم تصعيد النزاع"); setSelected(null); }}>تصعيد</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
