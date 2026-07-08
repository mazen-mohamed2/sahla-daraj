import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Coins, Plus } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/services/mock-data";
import { usePurchaseTokens } from "@/hooks/queries";
import type { ColumnDef } from "@tanstack/react-table";

export const Route = createFileRoute("/agency/tokens")({ component: Tokens });

type Tx = { id: string; type: string; amount: number; date: string };

const seedHistory: Tx[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `TK-${100 + i}`,
  type: i % 2 === 0 ? "شراء" : "استخدام",
  amount: (i % 2 === 0 ? 1 : -1) * (100 + i * 50),
  date: new Date(2025, 6, i + 1).toISOString(),
}));

const PACKAGES = [
  { amount: 100, price: 200, label: "100 توكن — 200 ج.م" },
  { amount: 500, price: 900, label: "500 توكن — 900 ج.م (الأوفر)" },
  { amount: 1000, price: 1600, label: "1000 توكن — 1,600 ج.م" },
];

function Tokens() {
  const purchase = usePurchaseTokens();
  const [balance, setBalance] = useState(2450);
  const [history, setHistory] = useState<Tx[]>(seedHistory);
  const [open, setOpen] = useState(false);
  const [pkg, setPkg] = useState("500");
  const [method, setMethod] = useState<"vodafone" | "instapay" | "card">("vodafone");
  const [account, setAccount] = useState("");

  const confirmBuy = () => {
    const selected = PACKAGES.find((p) => String(p.amount) === pkg)!;
    if (!account.trim()) { toast.error("أدخل بيانات الدفع"); return; }
    purchase.mutate(selected.amount, {
      onSuccess: (r) => {
        setBalance((b) => b + selected.amount);
        setHistory((h) => [{ id: r.transactionId, type: "شراء", amount: selected.amount, date: new Date().toISOString() }, ...h]);
        toast.success(`✅ تم شراء ${selected.amount} توكن بنجاح`);
        setOpen(false); setAccount("");
      },
    });
  };

  const cols: ColumnDef<Tx, unknown>[] = [
    { accessorKey: "id", header: "الرقم" },
    { accessorKey: "type", header: "النوع" },
    { accessorKey: "amount", header: "الكمية", cell: ({ row }) => (
      <span className={row.original.amount > 0 ? "text-success font-semibold" : "text-destructive font-semibold"}>
        {row.original.amount > 0 ? "+" : ""}{row.original.amount.toLocaleString("ar-EG")}
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
            <div className="mt-1 font-display text-5xl font-black">{balance.toLocaleString("ar-EG")} <span className="text-xl">توكن</span></div>
            <div className="mt-1 text-sm opacity-90">يعادل ~ {(balance * 2).toLocaleString("ar-EG")} ج.م</div>
          </div>
          <Button size="lg" variant="secondary" onClick={() => setOpen(true)}>
            <Plus className="ml-2 size-4" /> شراء توكن
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader><CardTitle className="flex items-center gap-2 font-display"><Coins className="size-5" /> سجل المعاملات</CardTitle></CardHeader>
        <CardContent>
          <DataTable
            columns={cols} data={history}
            statusOptions={[{ value: "شراء", label: "شراء" }, { value: "استخدام", label: "استخدام" }]}
            statusKey="type"
          />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>شراء رصيد توكن</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">اختر الباقة</Label>
              <RadioGroup value={pkg} onValueChange={setPkg} className="space-y-2">
                {PACKAGES.map((p) => (
                  <label key={p.amount} className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-muted/40">
                    <RadioGroupItem value={String(p.amount)} />
                    <span className="font-medium">{p.label}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
            <div>
              <Label>طريقة الدفع</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vodafone">فودافون كاش</SelectItem>
                  <SelectItem value="instapay">إنستاباي</SelectItem>
                  <SelectItem value="card">بطاقة بنكية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{method === "card" ? "رقم البطاقة" : "رقم المحفظة"}</Label>
              <Input value={account} onChange={(e) => setAccount(e.target.value)} placeholder={method === "card" ? "0000 0000 0000 0000" : "+20 100 000 0000"} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={confirmBuy} disabled={purchase.isPending}>{purchase.isPending ? "جارٍ..." : "تأكيد الشراء"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
