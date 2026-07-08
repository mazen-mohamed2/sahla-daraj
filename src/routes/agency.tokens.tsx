import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Coins, Plus } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/services/mock-data";
import { usePurchaseTokens } from "@/hooks/queries";
import {
  MultiStepDialog, ProcessingStep, SuccessStep, FailureStep, ReviewRow, StepFooter,
  PaymentMethodPicker, METHOD_LABEL, type PaymentMethod, useMockProcess,
} from "@/components/flow";
import { useMoney } from "@/lib/format";
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
  { amount: 100, price: 200, badge: undefined as string | undefined },
  { amount: 500, price: 900, badge: "الأوفر" },
  { amount: 1000, price: 1600, badge: undefined },
];

const STEPS = [
  { key: "pkg", label: "الباقة" },
  { key: "pay", label: "الدفع" },
  { key: "review", label: "المراجعة" },
  { key: "done", label: "التأكيد" },
];

function Tokens() {
  const money = useMoney();
  const purchase = usePurchaseTokens();
  const [balance, setBalance] = useState(2450);
  const [history, setHistory] = useState<Tx[]>(seedHistory);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [pkgIdx, setPkgIdx] = useState(1);
  const [method, setMethod] = useState<PaymentMethod>("vodafone");
  const [account, setAccount] = useState("");
  const [accountError, setAccountError] = useState<string | undefined>();
  const proc = useMockProcess();

  const pkg = PACKAGES[pkgIdx];

  const reset = () => { setStep(0); setPkgIdx(1); setMethod("vodafone"); setAccount(""); setAccountError(undefined); proc.reset(); };
  const close = () => { setOpen(false); setTimeout(reset, 250); };

  const validateAccount = () => {
    if (account.trim().length < 6) { setAccountError("أدخل بيانات دفع صحيحة"); return false; }
    setAccountError(undefined); return true;
  };

  const submit = async () => {
    setStep(3);
    const ok = await proc.run(async () => { await purchase.mutateAsync(pkg.amount); });
    if (ok) {
      const id = `TK-${Date.now()}`;
      setBalance((b) => b + pkg.amount);
      setHistory((h) => [{ id, type: "شراء", amount: pkg.amount, date: new Date().toISOString() }, ...h]);
      toast.success(`✅ تم شراء ${pkg.amount} توكن`);
    }
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
            <div className="mt-1 text-sm opacity-90">يعادل ~ {money(balance * 2)}</div>
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

      <MultiStepDialog
        open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}
        title="شراء رصيد توكن"
        steps={STEPS} currentStep={step}
        locked={proc.status === "processing"}
      >
        {step === 0 && (
          <>
            <Label className="mb-3 block">اختر الباقة الأنسب</Label>
            <RadioGroup value={String(pkgIdx)} onValueChange={(v) => setPkgIdx(Number(v))} className="space-y-2">
              {PACKAGES.map((p, i) => (
                <label key={p.amount} className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors hover:bg-muted/40 ${pkgIdx === i ? "border-primary bg-primary/5" : ""}`}>
                  <RadioGroupItem value={String(i)} />
                  <div className="flex-1">
                    <div className="font-semibold">{p.amount.toLocaleString("ar-EG")} توكن</div>
                    <div className="text-xs text-muted-foreground">{money(p.price)}</div>
                  </div>
                  {p.badge && <span className="text-xs rounded-full bg-success/15 text-success px-2 py-0.5 font-semibold">{p.badge}</span>}
                </label>
              ))}
            </RadioGroup>
            <StepFooter>
              <Button variant="outline" className="flex-1" onClick={close}>إلغاء</Button>
              <Button className="flex-1" onClick={() => setStep(1)}>التالي</Button>
            </StepFooter>
          </>
        )}

        {step === 1 && (
          <>
            <PaymentMethodPicker value={method} onChange={setMethod} account={account} onAccountChange={(v: string) => { setAccount(v); if (accountError) setAccountError(undefined); }} error={accountError} />
            <StepFooter>
              <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>رجوع</Button>
              <Button className="flex-1" onClick={() => { if (validateAccount()) setStep(2); }}>التالي</Button>
            </StepFooter>
          </>
        )}

        {step === 2 && (
          <>
            <ReviewRow label="الباقة" value={`${pkg.amount.toLocaleString("ar-EG")} توكن`} />
            <ReviewRow label="طريقة الدفع" value={METHOD_LABEL[method]} />
            <ReviewRow label="حساب الدفع" value={account} />
            <ReviewRow label="الإجمالي" value={money(pkg.price)} emphasis />
            <StepFooter>
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>رجوع</Button>
              <Button className="flex-1" onClick={submit}>تأكيد الدفع</Button>
            </StepFooter>
          </>
        )}

        {step === 3 && proc.status === "processing" && <ProcessingStep message="جارٍ إتمام عملية الشراء..." />}
        {step === 3 && proc.status === "success" && (
          <SuccessStep title="تم شراء الرصيد بنجاح"
            message={<span>تمت إضافة <b>{pkg.amount.toLocaleString("ar-EG")}</b> توكن لرصيدك</span>}
            primaryLabel="تم" onPrimary={close} />
        )}
        {step === 3 && proc.status === "error" && (
          <FailureStep message={proc.error} onRetry={submit} onCancel={close} />
        )}
      </MultiStepDialog>
    </DashboardLayout>
  );
}
