import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { Coins, Plus } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/services/mock-data";
import type { ColumnDef } from "@tanstack/react-table";

export const Route = createFileRoute("/agency/tokens")({ component: Tokens });

type Tx = { id: string; type: string; amount: number; date: string };

const history: Tx[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `TK-${100 + i}`,
  type: i % 2 === 0 ? "شراء" : "استخدام",
  amount: (i % 2 === 0 ? 1 : -1) * (100 + i * 50),
  date: new Date(2025, 6, i + 1).toISOString(),
}));

function Tokens() {
  const cols: ColumnDef<Tx, unknown>[] = [
    { accessorKey: "id", header: "الرقم" },
    { accessorKey: "type", header: "النوع" },
    { accessorKey: "amount", header: "الكمية", cell: ({ row }) => (
      <span className={row.original.amount > 0 ? "text-success font-semibold" : "text-destructive font-semibold"}>
        {row.original.amount > 0 ? "+" : ""}{row.original.amount.toLocaleString("ar-SA")}
      </span>
    )},
    { accessorKey: "date", header: "التاريخ", cell: ({ row }) => formatDate(row.original.date) },
  ];

  return (
    <DashboardLayout title="رصيد التوكن">
      <Card className="bg-gradient-to-l from-primary to-primary/70 text-primary-foreground">
        <CardContent className="p-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-sm opacity-90">الرصيد الحالي</div>
            <div className="mt-1 font-display text-5xl font-black">2,450 <span className="text-xl">توكن</span></div>
            <div className="mt-1 text-sm opacity-90">يعادل ~ 4,900 ريال</div>
          </div>
          <Button size="lg" variant="secondary" onClick={() => toast.success("سيتم توجيهك للدفع")}>
            <Plus className="ml-2 size-4" /> شراء توكن
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader><CardTitle className="flex items-center gap-2 font-display"><Coins className="size-5" /> سجل المعاملات</CardTitle></CardHeader>
        <CardContent><DataTable columns={cols} data={history} /></CardContent>
      </Card>
    </DashboardLayout>
  );
}
