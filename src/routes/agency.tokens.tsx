import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { Label } from "@/components/ui/label";
import { Coins, Plus } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/services/mock-data";
import { usePurchaseTokens } from "@/hooks/queries";
import { MultiStepDialog, PaymentMethodPicker, ReviewRow, ProcessingStep, SuccessStep, FailureStep, StepFooter, METHOD_LABEL, type PaymentMethod, useMockProcess } from "@/components/flow";
import { cn } from "@/lib/utils";
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
  { amount: 100, price: 200, label: "الأساسية", tag: "" },
  { amount: 500, price: 900, label: "الأكثر شعبية", tag: "الأوفر (وفر 10%)" },
  { amount: 1000, price: 1600, label: "الاحترافية", tag: "وفر 20%" },
  { amount: 3000, price: 4500, label: "المؤسسات", tag: "وفر 25%" },
];

const STEPS = [
  { key: "pkg", label: "الباقة" },
  { key: "method", label: "الدفع" },
  { key: "review", label: "المراجعة" },
  { key: "done", label: "التأكيد" },
];

function Tokens() {
  const purchase = usePurchaseTokens();
  const [balance, setBalance] = useState(2450);
  const [history, setHistory] = useState<Tx[]>(seedHistory);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [pkg, setPkg] = useState(1);
  const [method, setMethod] = useState<PaymentMethod>("vodafone");
  const [account, setAccount] = useState("");
  const [acctError, setAcctError] = useState<string | undefined>();
  const proc = useMockProcess();

  const selected = PACKAGES[pkg];

  const close = () => {
    setOpen(false);
    setTimeout(() => { setStep(0); setPkg(1); setMethod("vodafone"); setAccount(""); setAcctError(undefined); proc.reset(); }, 300);
  };

  const nextMethod = () => {
    if (account.trim().length < 6) { setAcctError("بيانات الدفع غير صحيحة"); return; }
    setAcctError(undefined); setStep(2);
  };

  const confirm = async () => {
    setStep(3);
    await proc.run(async () => {
      const r = await purchase.mutateAsync(selected.amount);
      setBalance((b) => b + selected.amount);
      setHistory((h) => [{ id: r.transactionId, type: "شراء", amount: selected.amount, date: new Date().toISOString() }, ...h]);
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

      <MultiStepDialog open={open} onOpenChange={(o) => !o && close()} title="شراء رصيد توكن" steps={STEPS} currentStep={Math.min(step, 3)} locked={proc.status === "processing"}>
        {step === 0 && (
          <div>
            <Label className="mb-2 block">اختر الباقة</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PACKAGES.map((p, i) => {
                const active = i === pkg;
                return (
                  <button key={p.amount} type="button" onClick={() => setPkg(i)}
                    className={cn("text-start rounded-lg border p-3 transition-all", active ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "hover:bg-muted/40")}>
                    <div className="text-xs text-muted-foreground">{p.label}</div>
                    <div className="font-display font-bold text-lg">{p.amount.toLocaleString("ar-EG")} توكن</div>
                    <div className="text-sm">{p.price.toLocaleString("ar-EG")} ج.م</div>
                    {p.tag && <div className="mt-1 inline-block text-[10px] bg-success/15 text-success rounded px-2 py-0.5">{p.tag}</div>}
                  </button>
                );
              })}
            </div>
            <StepFooter>
              <Button variant="outline" className="flex-1" onClick={close}>إلغاء</Button>
              <Button className="flex-1" onClick={() => setStep(1)}>متابعة</Button>
            </StepFooter>
          </div>
        )}
        {step === 1 && (
          <div>
            <PaymentMethodPicker value={method} onChange={setMethod} account={account} onAccountChange={setAccount} error={acctError} />
            <StepFooter>
              <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>رجوع</Button>
              <Button className="flex-1" onClick={nextMethod}>متابعة</Button>
            </StepFooter>
          </div>
        )}
        {step === 2 && (
          <div>
            <div className="rounded-lg border p-3">
              <ReviewRow label="الباقة" value={`${selected.amount.toLocaleString("ar-EG")} توكن`} />
              <ReviewRow label="السعر" value={`${selected.price.toLocaleString("ar-EG")} ج.م`} emphasis />
              <ReviewRow label="طريقة الدفع" value={METHOD_LABEL[method]} />
              <ReviewRow label="الحساب" value={<span className="font-mono">{account}</span>} />
            </div>
            <StepFooter>
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>رجوع</Button>
              <Button className="flex-1" onClick={confirm}>تأكيد الشراء</Button>
            </StepFooter>
          </div>
        )}
        {step === 3 && proc.status === "processing" && <ProcessingStep />}
        {step === 3 && proc.status === "success" && (
          <SuccessStep title="تم إضافة الرصيد" message={<>تمت إضافة <strong>{selected.amount.toLocaleString("ar-EG")}</strong> توكن إلى حسابك.</>} onPrimary={() => { toast.success("تم تحديث الرصيد"); close(); }} />
        )}
        {step === 3 && proc.status === "error" && <FailureStep message={proc.error ?? undefined} onRetry={confirm} onCancel={close} />}
      </MultiStepDialog>
    </DashboardLayout>
  );
}
