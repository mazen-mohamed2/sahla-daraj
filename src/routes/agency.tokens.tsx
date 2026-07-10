import { useMemo, useState } from "react";
import { usePersistedState } from "@/lib/persist";

import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Coins, Plus, Smartphone, CreditCard, Building2, Wallet as WalletIcon, Copy, Check, Download, Eye, TrendingUp, ShoppingCart, Receipt } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/services/mock-data";
import { usePurchaseTokens } from "@/hooks/queries";
import {
  MultiStepDialog, ProcessingStep, SuccessStep, FailureStep, ReviewRow, StepFooter, useMockProcess,
} from "@/components/flow";
import { useMoney } from "@/lib/format";
import { useNotifications } from "@/store/notifications";
import { cn } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/status-badge";

export const Route = createFileRoute("/agency/tokens")({ component: Tokens });

// ─── Types ─────────────────────────────────────────────────────────────
type PayMethod = "vodafone" | "instapay" | "card" | "bank" | "fawry";
type Package = { id: string; name: string; tokens: number; price: number; badge?: string };

interface TokenTx {
  id: string;
  type: "شراء" | "استخدام";
  packageName?: string;
  tokens: number;
  amount: number;
  method?: PayMethod;
  status: "completed" | "pending" | "failed";
  date: string;
  reference?: string;
}

const PACKAGES: Package[] = [
  { id: "starter", name: "Starter", tokens: 100, price: 200 },
  { id: "pro", name: "Professional", tokens: 250, price: 475, badge: "الأكثر شيوعاً" },
  { id: "business", name: "Business", tokens: 500, price: 900, badge: "الأوفر" },
  { id: "enterprise", name: "Enterprise", tokens: 1000, price: 1600 },
];

const METHOD_LABEL: Record<PayMethod, string> = {
  vodafone: "فودافون كاش",
  instapay: "إنستاباي",
  card: "بطاقة بنكية",
  bank: "تحويل بنكي",
  fawry: "فوري",
};

const METHOD_ICON: Record<PayMethod, React.ComponentType<{ className?: string }>> = {
  vodafone: Smartphone,
  instapay: Smartphone,
  card: CreditCard,
  bank: Building2,
  fawry: WalletIcon,
};

const seedHistory: TokenTx[] = [
  { id: "TK-1042", type: "شراء", packageName: "Professional", tokens: 250, amount: 475, method: "card", status: "completed", date: new Date(Date.now() - 86400000 * 2).toISOString(), reference: "REF-88213" },
  { id: "TK-1041", type: "استخدام", tokens: -50, amount: 0, status: "completed", date: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: "TK-1040", type: "شراء", packageName: "Starter", tokens: 100, amount: 200, method: "vodafone", status: "completed", date: new Date(Date.now() - 86400000 * 6).toISOString(), reference: "REF-88190" },
  { id: "TK-1039", type: "استخدام", tokens: -30, amount: 0, status: "completed", date: new Date(Date.now() - 86400000 * 8).toISOString() },
  { id: "TK-1038", type: "شراء", packageName: "Business", tokens: 500, amount: 900, method: "instapay", status: "completed", date: new Date(Date.now() - 86400000 * 14).toISOString(), reference: "REF-88101" },
];

const STEPS = [
  { key: "pkg", label: "الباقة" },
  { key: "pay", label: "الدفع" },
  { key: "review", label: "المراجعة" },
  { key: "done", label: "التأكيد" },
];

const VAT_RATE = 0.14;
const FEE_RATE = 0.015;

// ─── Payment field state ───────────────────────────────────────────────
interface PayState {
  vodafoneMobile: string;
  instapayMode: "mobile" | "address" | "iban";
  instapayMobile: string;
  instapayAddress: string;
  instapayIban: string;
  cardHolder: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  bankHolder: string;
  bankName: string;
  bankIban: string;
  bankSwift: string;
  fawryRef: string;
}

const emptyPay: PayState = {
  vodafoneMobile: "",
  instapayMode: "mobile",
  instapayMobile: "",
  instapayAddress: "",
  instapayIban: "",
  cardHolder: "",
  cardNumber: "",
  cardExpiry: "",
  cardCvv: "",
  bankHolder: "",
  bankName: "",
  bankIban: "",
  bankSwift: "",
  fawryRef: "",
};

// ─── Page ──────────────────────────────────────────────────────────────
function Tokens() {
  const money = useMoney();
  const purchase = usePurchaseTokens();
  const notify = useNotifications((s) => s.add);

  const [balance, setBalance] = usePersistedState<number>("agency-token-balance", 2450);
  const [history, setHistory] = usePersistedState<TokenTx[]>("agency-token-history", seedHistory);


  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [pkgId, setPkgId] = useState<string>("pro");
  const [method, setMethod] = useState<PayMethod>("vodafone");
  const [pay, setPay] = useState<PayState>(emptyPay);
  const [payError, setPayError] = useState<string | undefined>();
  const [lastTx, setLastTx] = useState<TokenTx | null>(null);
  const [detail, setDetail] = useState<TokenTx | null>(null);
  const proc = useMockProcess();

  const pkg = useMemo(() => PACKAGES.find((p) => p.id === pkgId)!, [pkgId]);
  const vat = Math.round(pkg.price * VAT_RATE);
  const fees = Math.round(pkg.price * FEE_RATE);
  const total = pkg.price + vat + fees;

  // Stats
  const stats = useMemo(() => {
    const purchases = history.filter((t) => t.type === "شراء" && t.status === "completed");
    const totalSpent = purchases.reduce((s, t) => s + t.amount, 0);
    const totalPurchased = purchases.reduce((s, t) => s + t.tokens, 0);
    return { spent: totalSpent, purchased: totalPurchased, tx: purchases.length };
  }, [history]);

  const reset = () => {
    setStep(0); setPkgId("pro"); setMethod("vodafone");
    setPay(emptyPay); setPayError(undefined); proc.reset();
  };
  const close = () => { setOpen(false); setTimeout(reset, 250); };

  const validatePayment = (): boolean => {
    setPayError(undefined);
    const invalid = (msg: string) => { setPayError(msg); return false; };
    if (method === "vodafone") {
      if (!/^(\+?20)?01[0-9]{9}$/.test(pay.vodafoneMobile.replace(/\s/g, ""))) return invalid("أدخل رقم موبايل صحيح");
    } else if (method === "instapay") {
      if (pay.instapayMode === "mobile" && pay.instapayMobile.trim().length < 10) return invalid("أدخل رقم موبايل صحيح");
      if (pay.instapayMode === "address" && !/^[\w.-]+@[\w.-]+$/.test(pay.instapayAddress)) return invalid("أدخل عنوان إنستاباي صحيح");
      if (pay.instapayMode === "iban" && pay.instapayIban.replace(/\s/g, "").length < 15) return invalid("أدخل IBAN صحيح");
    } else if (method === "card") {
      if (pay.cardHolder.trim().length < 3) return invalid("أدخل اسم حامل البطاقة");
      if (pay.cardNumber.replace(/\s/g, "").length < 12) return invalid("رقم بطاقة غير صحيح");
      if (!/^\d{2}\/\d{2}$/.test(pay.cardExpiry)) return invalid("تاريخ الانتهاء بصيغة MM/YY");
      if (!/^\d{3,4}$/.test(pay.cardCvv)) return invalid("CVV غير صحيح");
    } else if (method === "bank") {
      if (pay.bankHolder.trim().length < 3) return invalid("أدخل اسم صاحب الحساب");
      if (pay.bankName.trim().length < 2) return invalid("أدخل اسم البنك");
      if (pay.bankIban.replace(/\s/g, "").length < 15) return invalid("أدخل IBAN صحيح");
      if (pay.bankSwift.trim().length < 6) return invalid("أدخل SWIFT Code صحيح");
    } else if (method === "fawry") {
      if (!pay.fawryRef) return invalid("قم بتوليد كود الدفع أولاً");
    }
    return true;
  };

  const paymentSummary = (): string => {
    if (method === "vodafone") return pay.vodafoneMobile;
    if (method === "instapay") {
      if (pay.instapayMode === "mobile") return pay.instapayMobile;
      if (pay.instapayMode === "address") return pay.instapayAddress;
      return pay.instapayIban;
    }
    if (method === "card") return `**** **** **** ${pay.cardNumber.slice(-4)}`;
    if (method === "bank") return `${pay.bankName} — ${pay.bankIban.slice(-6)}`;
    return pay.fawryRef;
  };

  const submit = async () => {
    setStep(3);
    const ok = await proc.run(async () => { await purchase.mutateAsync(pkg.tokens); });
    if (ok) {
      const tx: TokenTx = {
        id: `TK-${Date.now().toString().slice(-6)}`,
        type: "شراء",
        packageName: pkg.name,
        tokens: pkg.tokens,
        amount: total,
        method,
        status: "completed",
        date: new Date().toISOString(),
        reference: `REF-${Math.floor(Math.random() * 900000 + 100000)}`,
      };
      setBalance((b) => b + pkg.tokens);
      setHistory((h) => [tx, ...h]);
      setLastTx(tx);
      notify("agency", { title: "تم شراء رصيد التوكن", message: `تمت إضافة ${pkg.tokens} توكن (${pkg.name}) إلى حسابك`, category: "wallet", relatedEntityType: "token_tx", relatedEntityId: tx.id, actionUrl: "/agency/tokens", priority: "medium" });
      toast.success(`✅ تم شراء ${pkg.tokens} توكن`);
    }
  };

  const cols: ColumnDef<TokenTx, unknown>[] = [
    { accessorKey: "id", header: "الرقم", cell: ({ row }) => <span className="font-mono text-xs">{row.original.id}</span> },
    { accessorKey: "type", header: "النوع" },
    { accessorKey: "packageName", header: "الباقة", cell: ({ row }) => row.original.packageName ?? "—" },
    { accessorKey: "tokens", header: "التوكنات", cell: ({ row }) => (
      <span className={row.original.tokens > 0 ? "text-success font-semibold" : "text-destructive font-semibold"}>
        {row.original.tokens > 0 ? "+" : ""}{row.original.tokens.toLocaleString("ar-EG")}
      </span>
    )},
    { accessorKey: "amount", header: "المبلغ", cell: ({ row }) => row.original.amount ? money(row.original.amount) : "—" },
    { accessorKey: "status", header: "الحالة", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "date", header: "التاريخ", cell: ({ row }) => formatDate(row.original.date) },
    { id: "actions", header: "", cell: ({ row }) => (
      <Button variant="ghost" size="sm" onClick={() => setDetail(row.original)}>
        <Eye className="ml-1 size-4" /> عرض
      </Button>
    )},
  ];

  return (
    <DashboardLayout title="رصيد التوكن">
      {/* Balance card */}
      <Card className="bg-gradient-to-l from-primary to-primary/70 text-primary-foreground">
        <CardContent className="p-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-sm opacity-90">الرصيد الحالي</div>
            <div className="mt-1 font-display text-5xl font-black">
              {balance.toLocaleString("ar-EG")} <span className="text-xl">توكن</span>
            </div>
            <div className="mt-1 text-sm opacity-90">يعادل ~ {money(balance * 2)}</div>
          </div>
          <Button size="lg" variant="secondary" onClick={() => setOpen(true)}>
            <Plus className="ml-2 size-4" /> شراء توكن
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 mt-6">
        <StatMini icon={ShoppingCart} label="إجمالي المشتريات" value={stats.tx.toLocaleString("ar-EG")} />
        <StatMini icon={TrendingUp} label="توكنات مشتراة" value={stats.purchased.toLocaleString("ar-EG")} />
        <StatMini icon={Receipt} label="إجمالي الإنفاق" value={money(stats.spent)} />
      </div>

      {/* History */}
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

      {/* Purchase flow */}
      <MultiStepDialog
        open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}
        title="شراء رصيد توكن"
        steps={STEPS} currentStep={step}
        locked={proc.status === "processing"}
      >
        {step === 0 && (
          <>
            <Label className="mb-3 block">اختر الباقة الأنسب</Label>
            <RadioGroup value={pkgId} onValueChange={setPkgId} className="grid gap-2 sm:grid-cols-2">
              {PACKAGES.map((p) => (
                <label key={p.id} className={cn(
                  "flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors hover:bg-muted/40",
                  pkgId === p.id && "border-primary bg-primary/5 ring-1 ring-primary/30",
                )}>
                  <RadioGroupItem value={p.id} className="mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold">{p.name}</div>
                      {p.badge && <span className="text-[10px] rounded-full bg-success/15 text-success px-2 py-0.5 font-semibold shrink-0">{p.badge}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{p.tokens.toLocaleString("ar-EG")} توكن</div>
                    <div className="text-sm font-bold text-primary mt-1">{money(p.price)}</div>
                  </div>
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
            <div>
              <Label className="mb-2 block">طريقة الدفع</Label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(METHOD_LABEL) as PayMethod[]).map((m) => {
                  const Icon = METHOD_ICON[m];
                  const active = method === m;
                  return (
                    <button
                      key={m} type="button"
                      onClick={() => { setMethod(m); setPayError(undefined); }}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border p-3 text-sm transition-all",
                        active ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "hover:bg-muted/40",
                      )}
                    >
                      <Icon className={cn("size-4", active && "text-primary")} />
                      <span className="font-medium">{METHOD_LABEL[m]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <PaymentFields method={method} pay={pay} setPay={setPay} />
              {payError && <p className="text-xs text-destructive">{payError}</p>}
            </div>

            <StepFooter>
              <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>رجوع</Button>
              <Button className="flex-1" onClick={() => { if (validatePayment()) setStep(2); }}>التالي</Button>
            </StepFooter>
          </>
        )}

        {step === 2 && (
          <>
            <ReviewRow label="الباقة" value={pkg.name} />
            <ReviewRow label="عدد التوكنات" value={`${pkg.tokens.toLocaleString("ar-EG")} توكن`} />
            <ReviewRow label="السعر" value={money(pkg.price)} />
            <ReviewRow label={`ضريبة القيمة المضافة (${Math.round(VAT_RATE * 100)}%)`} value={money(vat)} />
            <ReviewRow label="رسوم الخدمة" value={money(fees)} />
            <ReviewRow label="طريقة الدفع" value={METHOD_LABEL[method]} />
            <ReviewRow label="بيانات الدفع" value={<span className="font-mono text-xs">{paymentSummary()}</span>} />
            <ReviewRow label="الإجمالي" value={money(total)} emphasis />
            <StepFooter>
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>رجوع</Button>
              <Button className="flex-1" onClick={submit}>تأكيد الدفع</Button>
            </StepFooter>
          </>
        )}

        {step === 3 && proc.status === "processing" && <ProcessingStep message="جارٍ إتمام عملية الشراء..." />}
        {step === 3 && proc.status === "success" && lastTx && (
          <SuccessDetail tx={lastTx} onView={() => { setDetail(lastTx); close(); }} onDone={close} money={money} />
        )}
        {step === 3 && proc.status === "error" && (
          <FailureStep message={proc.error} onRetry={submit} onCancel={close} />
        )}
      </MultiStepDialog>

      {/* Transaction detail */}
      <Dialog open={!!detail} onOpenChange={(o) => { if (!o) setDetail(null); }}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-display">تفاصيل المعاملة</DialogTitle></DialogHeader>
          {detail && (
            <div className="pt-2">
              <ReviewRow label="رقم المعاملة" value={<span className="font-mono text-xs">{detail.id}</span>} />
              <ReviewRow label="النوع" value={detail.type} />
              {detail.packageName && <ReviewRow label="الباقة" value={detail.packageName} />}
              <ReviewRow label="التوكنات" value={
                <span className={detail.tokens > 0 ? "text-success font-semibold" : "text-destructive font-semibold"}>
                  {detail.tokens > 0 ? "+" : ""}{detail.tokens.toLocaleString("ar-EG")}
                </span>
              } />
              {detail.amount > 0 && <ReviewRow label="المبلغ" value={money(detail.amount)} />}
              {detail.method && <ReviewRow label="طريقة الدفع" value={METHOD_LABEL[detail.method]} />}
              {detail.reference && <ReviewRow label="المرجع" value={<span className="font-mono text-xs">{detail.reference}</span>} />}
              <ReviewRow label="الحالة" value={<StatusBadge status={detail.status} />} />
              <ReviewRow label="التاريخ" value={formatDate(detail.date)} />
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => downloadInvoice(detail)}>
                  <Download className="ml-2 size-4" /> تحميل الفاتورة
                </Button>
                <Button className="flex-1" onClick={() => setDetail(null)}>إغلاق</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────
function StatMini({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="size-10 rounded-lg bg-primary/10 grid place-items-center">
          <Icon className="size-5 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="font-display text-lg font-bold truncate">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentFields({ method, pay, setPay }: { method: PayMethod; pay: PayState; setPay: React.Dispatch<React.SetStateAction<PayState>> }) {
  const upd = <K extends keyof PayState>(k: K, v: PayState[K]) => setPay((p) => ({ ...p, [k]: v }));

  if (method === "vodafone") {
    return (
      <Field label="رقم الموبايل">
        <Input value={pay.vodafoneMobile} onChange={(e) => upd("vodafoneMobile", e.target.value)} placeholder="+20 100 000 0000" inputMode="tel" />
      </Field>
    );
  }

  if (method === "instapay") {
    return (
      <Tabs value={pay.instapayMode} onValueChange={(v) => upd("instapayMode", v as PayState["instapayMode"])}>
        <TabsList className="w-full">
          <TabsTrigger value="mobile" className="flex-1">رقم موبايل</TabsTrigger>
          <TabsTrigger value="address" className="flex-1">عنوان إنستاباي</TabsTrigger>
          <TabsTrigger value="iban" className="flex-1">IBAN</TabsTrigger>
        </TabsList>
        <TabsContent value="mobile" className="mt-3">
          <Field label="رقم الموبايل"><Input value={pay.instapayMobile} onChange={(e) => upd("instapayMobile", e.target.value)} placeholder="+20 100 000 0000" inputMode="tel" /></Field>
        </TabsContent>
        <TabsContent value="address" className="mt-3">
          <Field label="عنوان إنستاباي"><Input value={pay.instapayAddress} onChange={(e) => upd("instapayAddress", e.target.value)} placeholder="user@instapay" /></Field>
        </TabsContent>
        <TabsContent value="iban" className="mt-3">
          <Field label="IBAN"><Input value={pay.instapayIban} onChange={(e) => upd("instapayIban", e.target.value)} placeholder="EG00 0000 0000 0000 0000 0000" /></Field>
        </TabsContent>
      </Tabs>
    );
  }

  if (method === "card") {
    return (
      <div className="grid gap-3">
        <Field label="اسم حامل البطاقة"><Input value={pay.cardHolder} onChange={(e) => upd("cardHolder", e.target.value)} placeholder="AHMED MOHAMED" /></Field>
        <Field label="رقم البطاقة"><Input value={pay.cardNumber} onChange={(e) => upd("cardNumber", e.target.value)} placeholder="0000 0000 0000 0000" inputMode="numeric" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="تاريخ الانتهاء"><Input value={pay.cardExpiry} onChange={(e) => upd("cardExpiry", e.target.value)} placeholder="MM/YY" /></Field>
          <Field label="CVV"><Input value={pay.cardCvv} onChange={(e) => upd("cardCvv", e.target.value)} placeholder="123" inputMode="numeric" maxLength={4} /></Field>
        </div>
      </div>
    );
  }

  if (method === "bank") {
    return (
      <div className="grid gap-3">
        <Field label="اسم صاحب الحساب"><Input value={pay.bankHolder} onChange={(e) => upd("bankHolder", e.target.value)} placeholder="أحمد محمد" /></Field>
        <Field label="اسم البنك"><Input value={pay.bankName} onChange={(e) => upd("bankName", e.target.value)} placeholder="البنك الأهلي المصري" /></Field>
        <Field label="IBAN"><Input value={pay.bankIban} onChange={(e) => upd("bankIban", e.target.value)} placeholder="EG00 0000 0000 0000 0000 0000" /></Field>
        <Field label="SWIFT Code"><Input value={pay.bankSwift} onChange={(e) => upd("bankSwift", e.target.value)} placeholder="NBEGEGCX" /></Field>
      </div>
    );
  }

  // fawry
  return <FawryReference value={pay.fawryRef} onChange={(v) => upd("fawryRef", v)} />;
}

function FawryReference({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [copied, setCopied] = useState(false);
  const generate = () => onChange(`FWR-${Math.floor(Math.random() * 900000000 + 100000000)}`);
  const copy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true); toast.success("تم نسخ كود الدفع");
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
        سيتم إنشاء كود دفع فوري يمكنك دفعه في أقرب فرع أو من تطبيق فوري خلال 48 ساعة.
      </div>
      {!value ? (
        <Button type="button" variant="secondary" className="w-full" onClick={generate}>
          توليد كود الدفع
        </Button>
      ) : (
        <Field label="كود الدفع">
          <div className="flex gap-2">
            <Input value={value} readOnly className="font-mono tracking-widest" />
            <Button type="button" variant="outline" size="icon" onClick={copy} aria-label="نسخ">
              {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
            </Button>
          </div>
        </Field>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function SuccessDetail({ tx, onView, onDone, money }: { tx: TokenTx; onView: () => void; onDone: () => void; money: (n: number) => string }) {
  return (
    <div className="flex flex-col items-center py-4 gap-4 text-center">
      <div className="size-14 rounded-full bg-success/15 grid place-items-center animate-in zoom-in-50 duration-300">
        <Check className="size-8 text-success" />
      </div>
      <div>
        <div className="font-display text-xl font-bold">تم شراء الرصيد بنجاح</div>
        <div className="text-sm text-muted-foreground mt-1">تمت إضافة {tx.tokens.toLocaleString("ar-EG")} توكن إلى رصيدك</div>
      </div>
      <div className="w-full text-start">
        <ReviewRow label="رقم المعاملة" value={<span className="font-mono text-xs">{tx.id}</span>} />
        <ReviewRow label="عدد التوكنات" value={`${tx.tokens.toLocaleString("ar-EG")} توكن`} />
        <ReviewRow label="المبلغ المدفوع" value={money(tx.amount)} emphasis />
        <ReviewRow label="تاريخ الشراء" value={formatDate(tx.date)} />
      </div>
      <div className="grid grid-cols-2 gap-2 w-full pt-2">
        <Button variant="outline" onClick={() => downloadInvoice(tx)}>
          <Download className="ml-2 size-4" /> تحميل الفاتورة
        </Button>
        <Button variant="outline" onClick={onView}>
          <Eye className="ml-2 size-4" /> عرض المعاملة
        </Button>
      </div>
      <Button className="w-full" onClick={onDone}>تم</Button>
    </div>
  );
}

// ─── Invoice (mock text/PDF) ──────────────────────────────────────────
function downloadInvoice(tx: TokenTx) {
  const content = [
    "CarMarket — Invoice / فاتورة",
    "================================",
    `Transaction ID: ${tx.id}`,
    `Reference: ${tx.reference ?? "—"}`,
    `Date: ${new Date(tx.date).toLocaleString("ar-EG")}`,
    `Package: ${tx.packageName ?? "—"}`,
    `Tokens: ${tx.tokens}`,
    `Amount: ${tx.amount.toLocaleString("ar-EG")} EGP`,
    `Payment method: ${tx.method ? METHOD_LABEL[tx.method] : "—"}`,
    `Status: ${tx.status}`,
    "================================",
    "شكراً لتعاملك مع CarMarket",
  ].join("\n");
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `invoice-${tx.id}.txt`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
  toast.success("تم تحميل الفاتورة");
}
