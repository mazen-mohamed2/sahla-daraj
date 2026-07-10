import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { useMoney } from "@/lib/format";
import { formatDate } from "@/services/mock-data";
import {
  ESCROW_PIPELINE,
  DOC_KIND_LABELS_AR,
  DISPUTE_STATUS_LABELS_AR,
  type Escrow,
  type EscrowDocumentKind,
  type EscrowStatus,
} from "@/services/escrow-data";
import {
  useAddEscrowNote,
  useConfirmDelivery,
  useConfirmPurchase,
  useForceRefundEscrow,
  useForceReleaseEscrow,
  useMarkDelivered,
  useOpenDispute,
  useRequestRefund,
  useResolveDispute,
  useStartShipping,
  useUpdateTracking,
  useUploadEscrowDocument,
} from "@/hooks/escrows";
import { PayEscrowDialog } from "./pay-escrow-dialog";
import { ReasonDialog } from "@/components/flow/reason-dialog";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Circle,
  FileText,
  Truck,
  ShieldCheck,
  AlertTriangle,
  RefreshCcw,
  Upload,
  MessageSquarePlus,
  ShoppingBag,
  Copy,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

type Role = "user" | "agency" | "admin";

interface Props {
  escrow: Escrow | null;
  role: Role;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Fired AFTER the user's delivery-confirmation dialog fully closes and
   *  the escrow is released — so the parent can open the review dialog
   *  without stacking modal overlays. */
  onDeliveryConfirmed?: (escrow: Escrow) => void;
}


const DISPUTE_REASONS = [
  "عدم مطابقة الوصف",
  "السيارة بها عيوب خفية",
  "لم يتم التسليم",
  "تأخير غير مبرر",
  "أوراق ناقصة",
  "أخرى",
];

const REFUND_REASONS = [
  "لم يتم التسليم في الموعد",
  "تراجعت عن الصفقة",
  "عدم مطابقة السيارة",
  "أخرى",
];

export function EscrowDetailsDialog({ escrow, role, open, onOpenChange, onDeliveryConfirmed }: Props) {
  const money = useMoney();
  const [releaseJustConfirmed, setReleaseJustConfirmed] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [adminRefundOpen, setAdminRefundOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);

  const [trackingCompany, setTrackingCompany] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingStatus, setTrackingStatus] = useState("");
  const [trackingEta, setTrackingEta] = useState("");
  const [note, setNote] = useState("");
  const [docName, setDocName] = useState("");
  const [docKind, setDocKind] = useState<EscrowDocumentKind>("shipping_receipt");

  const confirmPurchase = useConfirmPurchase();
  const startShipping = useStartShipping();
  const updateTracking = useUpdateTracking();
  const markDelivered = useMarkDelivered();
  const confirmDelivery = useConfirmDelivery();
  const openDispute = useOpenDispute();
  const requestRefund = useRequestRefund();
  const uploadDoc = useUploadEscrowDocument();
  const addNote = useAddEscrowNote();
  const forceRelease = useForceReleaseEscrow();
  const forceRefund = useForceRefundEscrow();
  const resolveDispute = useResolveDispute();

  const total = useMemo(() => (escrow ? escrow.amount + escrow.shippingCost : 0), [escrow]);

  if (!escrow) return null;

  const currentIdx = ESCROW_PIPELINE.indexOf(escrow.status as EscrowStatus);
  const disputed = escrow.status === "disputed";
  const refunded = escrow.status === "refunded";

  const copy = (v: string) => { navigator.clipboard.writeText(v); toast.success("تم النسخ"); };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent dir="rtl" className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <DialogTitle className="font-display text-xl">{escrow.vehicle}</DialogTitle>
                <div className="text-sm text-muted-foreground mt-1">
                  ضمان <button onClick={() => copy(escrow.id)} className="font-mono text-primary hover:underline">{escrow.id}</button>
                </div>
              </div>
              <StatusBadge status={escrow.status} />
            </div>
          </DialogHeader>

          {/* Pipeline */}
          {!disputed && !refunded && (
            <div className="flex items-center gap-1 py-3 overflow-x-auto">
              {ESCROW_PIPELINE.map((s, i) => {
                const done = i < currentIdx;
                const active = i === currentIdx;
                return (
                  <div key={s} className="flex items-center gap-1 shrink-0">
                    <div className={cn(
                      "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] border transition-colors",
                      done && "bg-primary/10 border-primary/30 text-primary",
                      active && "bg-primary text-primary-foreground border-primary shadow-sm",
                      !done && !active && "border-border text-muted-foreground",
                    )}>
                      {done ? <CheckCircle2 className="size-3" /> : <Circle className="size-3" />}
                      <span>{STAGE_LABEL[s]}</span>
                    </div>
                    {i < ESCROW_PIPELINE.length - 1 && <div className="h-px w-3 bg-border" />}
                  </div>
                );
              })}
            </div>
          )}
          {disputed && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
              <AlertTriangle className="size-4 mt-0.5" />
              <div>
                <div className="font-semibold">النزاع {DISPUTE_STATUS_LABELS_AR[escrow.dispute?.status ?? "open"]}</div>
                <div className="text-xs mt-1">{escrow.dispute?.reason} — {escrow.dispute?.description}</div>
                {escrow.dispute?.resolution && <div className="text-xs mt-1 opacity-80">القرار: {escrow.dispute.resolution}</div>}
              </div>
            </div>
          )}

          <Tabs defaultValue="overview" className="mt-2">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="overview">النظرة العامة</TabsTrigger>
              <TabsTrigger value="timeline">السجل</TabsTrigger>
              <TabsTrigger value="tracking">التتبع</TabsTrigger>
              <TabsTrigger value="documents">الملفات ({escrow.documents.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-3 pt-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info label="المشتري" value={escrow.buyerName} />
                <Info label="المعرض" value={escrow.agencyName} />
                <Info label="ثمن السيارة" value={money(escrow.amount)} />
                <Info label="مصاريف الشحن" value={money(escrow.shippingCost)} />
                <Info label="عمولة المنصة" value={money(escrow.commission)} />
                <Info label="طريقة الدفع" value={escrow.paymentMethod ?? "—"} />
                <Info label="تاريخ الإنشاء" value={formatDate(escrow.createdAt)} />
                <Info label="آخر تحديث" value={formatDate(escrow.updatedAt)} />
              </div>
              <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">إجمالي المبلغ المحتجز</span>
                <span className="font-display text-xl font-bold text-primary">{money(total)}</span>
              </div>
              {escrow.notes && (
                <div className="rounded-lg border p-3 text-sm">
                  <div className="font-semibold mb-1">ملاحظات</div>
                  <div className="text-muted-foreground whitespace-pre-wrap">{escrow.notes}</div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="pt-3">
              <div className="space-y-3">
                {[...escrow.timeline].reverse().map((e) => (
                  <div key={e.id} className="flex gap-3">
                    <div className="w-1 rounded bg-primary/40 shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{e.message}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(e.at)} {e.actor && `• ${e.actor}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {(role === "agency" || role === "admin") && (
                <div className="border-t pt-3 mt-4">
                  <Label>إضافة ملاحظة</Label>
                  <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="اكتب ملاحظة داخلية..." />
                  <Button
                    size="sm"
                    className="mt-2"
                    disabled={!note.trim() || addNote.isPending}
                    onClick={() => addNote.mutate({ id: escrow.id, note }, { onSuccess: () => { toast.success("تمت إضافة الملاحظة"); setNote(""); } })}
                  >
                    <MessageSquarePlus className="ml-2 size-4" /> إضافة
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="tracking" className="pt-3 space-y-3">
              {escrow.tracking ? (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Info label="شركة الشحن" value={escrow.tracking.shippingCompany} />
                  <Info label="رقم التتبع" value={
                    <button onClick={() => copy(escrow.tracking!.trackingNumber)} className="font-mono text-primary hover:underline inline-flex items-center gap-1">
                      {escrow.tracking.trackingNumber} <Copy className="size-3" />
                    </button>
                  } />
                  <Info label="الحالة الحالية" value={escrow.tracking.currentStatus} />
                  <Info label="الوصول المتوقع" value={formatDate(escrow.tracking.estimatedArrival)} />
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  <Truck className="size-8 mx-auto mb-2 opacity-40" />
                  لم يبدأ الشحن بعد
                </div>
              )}
              {role === "agency" && (escrow.status === "purchased" || escrow.status === "shipping") && (
                <div className="rounded-lg border p-3 space-y-2">
                  <div className="font-semibold text-sm">
                    {escrow.status === "purchased" ? "بدء الشحن" : "تحديث الشحن"}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="شركة الشحن" value={trackingCompany} onChange={(e) => setTrackingCompany(e.target.value)} />
                    <Input placeholder="رقم التتبع" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
                    <Input placeholder="الحالة الحالية" value={trackingStatus} onChange={(e) => setTrackingStatus(e.target.value)} />
                    <Input type="date" value={trackingEta} onChange={(e) => setTrackingEta(e.target.value)} />
                  </div>
                  <Button
                    size="sm"
                    disabled={startShipping.isPending || updateTracking.isPending}
                    onClick={() => {
                      const payload = {
                        trackingNumber: trackingNumber || escrow.tracking?.trackingNumber || "",
                        shippingCompany: trackingCompany || escrow.tracking?.shippingCompany || "",
                        estimatedArrival: trackingEta ? new Date(trackingEta).toISOString() : (escrow.tracking?.estimatedArrival ?? ""),
                        currentStatus: trackingStatus || "في الطريق",
                      };
                      if (!payload.trackingNumber || !payload.shippingCompany) { toast.error("رقم التتبع وشركة الشحن مطلوبان"); return; }
                      if (escrow.status === "purchased") {
                        startShipping.mutate({ id: escrow.id, tracking: payload }, { onSuccess: () => toast.success("بدأ الشحن") });
                      } else {
                        updateTracking.mutate({ id: escrow.id, tracking: payload }, { onSuccess: () => toast.success("تم تحديث التتبع") });
                      }
                    }}
                  >
                    <Truck className="ml-2 size-4" /> {escrow.status === "purchased" ? "بدء الشحن" : "تحديث"}
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="documents" className="pt-3 space-y-2">
              {escrow.documents.length === 0 && (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  <FileText className="size-8 mx-auto mb-2 opacity-40" />
                  لا توجد مستندات مرفوعة
                </div>
              )}
              {escrow.documents.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <FileText className="size-5 text-primary" />
                    <div>
                      <div className="text-sm font-medium">{d.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {DOC_KIND_LABELS_AR[d.kind]} • {d.uploadedBy} • {formatDate(d.uploadedAt)}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">{DOC_KIND_LABELS_AR[d.kind]}</Badge>
                </div>
              ))}
              {(role === "agency" || role === "admin") && (
                <div className="rounded-lg border p-3 space-y-2">
                  <div className="font-semibold text-sm">رفع مستند جديد</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={docKind} onValueChange={(v) => setDocKind(v as EscrowDocumentKind)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(DOC_KIND_LABELS_AR) as EscrowDocumentKind[]).map((k) => (
                          <SelectItem key={k} value={k}>{DOC_KIND_LABELS_AR[k]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input placeholder="اسم الملف (مثال: receipt.pdf)" value={docName} onChange={(e) => setDocName(e.target.value)} />
                  </div>
                  <Button
                    size="sm"
                    disabled={!docName.trim() || uploadDoc.isPending}
                    onClick={() => uploadDoc.mutate({ id: escrow.id, kind: docKind, name: docName }, { onSuccess: () => { toast.success("تم رفع الملف"); setDocName(""); } })}
                  >
                    <Upload className="ml-2 size-4" /> رفع
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Role-based action bar */}
          <div className="border-t pt-4 mt-2 flex flex-wrap gap-2">
            {role === "user" && (
              <>
                {escrow.status === "pending_payment" && (
                  <Button className="flex-1 min-w-[160px]" onClick={() => setPayOpen(true)}>
                    <ShoppingBag className="ml-2 size-4" /> دفع الآن {money(total)}
                  </Button>
                )}
                {escrow.status === "awaiting_confirmation" && (
                  <Button className="flex-1 min-w-[160px]" onClick={() => setReleaseOpen(true)}>
                    <ShieldCheck className="ml-2 size-4" /> تأكيد الاستلام والإفراج
                  </Button>
                )}
                {(escrow.status === "paid" || escrow.status === "purchased" || escrow.status === "shipping" || escrow.status === "awaiting_confirmation" || escrow.status === "delivered") && (
                  <>
                    <Button variant="outline" className="flex-1 min-w-[140px] text-destructive" onClick={() => setDisputeOpen(true)}>
                      <AlertTriangle className="ml-2 size-4" /> فتح نزاع
                    </Button>
                    <Button variant="outline" onClick={() => setRefundOpen(true)}>
                      <RefreshCcw className="ml-2 size-4" /> طلب استرداد
                    </Button>
                  </>
                )}
                {escrow.status === "released" && (
                  <div className="w-full rounded-lg bg-success/10 border border-success/40 p-3 text-sm text-success flex items-center gap-2">
                    <CheckCircle2 className="size-4" /> تم إتمام الصفقة بنجاح
                  </div>
                )}
                {escrow.status === "refunded" && (
                  <div className="w-full rounded-lg bg-muted p-3 text-sm text-muted-foreground flex items-center gap-2">
                    <RefreshCcw className="size-4" /> تم استرداد المبلغ
                  </div>
                )}
              </>
            )}

            {role === "agency" && (
              <>
                {escrow.status === "paid" && (
                  <Button className="flex-1 min-w-[160px]" disabled={confirmPurchase.isPending} onClick={() => confirmPurchase.mutate({ id: escrow.id }, { onSuccess: () => toast.success("تم تأكيد الشراء") })}>
                    {confirmPurchase.isPending ? <Loader2 className="ml-2 size-4 animate-spin" /> : <ShoppingBag className="ml-2 size-4" />} تأكيد شراء السيارة
                  </Button>
                )}
                {escrow.status === "shipping" && escrow.tracking && (
                  <Button className="flex-1 min-w-[160px]" disabled={markDelivered.isPending} onClick={() => markDelivered.mutate({ id: escrow.id }, { onSuccess: () => toast.success("تم تسليم السيارة") })}>
                    {markDelivered.isPending ? <Loader2 className="ml-2 size-4 animate-spin" /> : <Truck className="ml-2 size-4" />} تأكيد التسليم
                  </Button>
                )}
                {escrow.status === "pending_payment" && (
                  <div className="w-full rounded-lg bg-warning/10 border border-warning/40 p-3 text-sm">بانتظار دفع المشتري.</div>
                )}
                {escrow.status === "released" && (
                  <div className="w-full rounded-lg bg-success/10 border border-success/40 p-3 text-sm text-success flex items-center gap-2">
                    <CheckCircle2 className="size-4" /> تم استلام {money(total)} في محفظتك
                  </div>
                )}
              </>
            )}

            {role === "admin" && (
              <>
                {escrow.status !== "released" && escrow.status !== "refunded" && (
                  <>
                    <Button variant="outline" className="flex-1 min-w-[140px]" onClick={() => setReleaseOpen(true)}>
                      <ShieldCheck className="ml-2 size-4" /> إفراج إجباري
                    </Button>
                    <Button variant="outline" className="flex-1 min-w-[140px] text-destructive" onClick={() => setAdminRefundOpen(true)}>
                      <RefreshCcw className="ml-2 size-4" /> استرداد إجباري
                    </Button>
                  </>
                )}
                {disputed && (
                  <Button className="flex-1 min-w-[140px]" onClick={() => setResolveOpen(true)}>
                    <Scale className="ml-2 size-4" /> حل النزاع
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment (user) */}
      <PayEscrowDialog open={payOpen} onOpenChange={setPayOpen} escrow={escrow} />

      {/* User release confirmation */}
      <ReasonDialog
        open={releaseOpen && role === "user"}
        onOpenChange={(o) => {
          setReleaseOpen(o);
          // When the release dialog fully closes AFTER a successful confirm,
          // close the details dialog first, THEN hand off to the parent so
          // it can open the review dialog with no overlay stacking.
          if (!o && releaseJustConfirmed && escrow) {
            setReleaseJustConfirmed(false);
            const target = escrow;
            onOpenChange(false);
            setTimeout(() => onDeliveryConfirmed?.(target), 250);
          }
        }}
        title="تأكيد الاستلام والإفراج"
        reasons={["استلمت السيارة والحالة مطابقة", "استلمت بعد فحص فني", "أخرى"]}
        minDetails={0}
        submitLabel="تأكيد الإفراج"
        successTitle="تم إتمام الصفقة"
        successMessage="تم تحويل المبلغ للمعرض بنجاح"
        onSubmit={async () => { await confirmDelivery.mutateAsync({ id: escrow.id }); setReleaseJustConfirmed(true); }}
      />


      {/* Admin release */}
      <ReasonDialog
        open={releaseOpen && role === "admin"}
        onOpenChange={setReleaseOpen}
        title="إفراج إجباري"
        reasons={["توفرت أدلة كافية للتسليم", "قرار إداري بعد التحقيق", "أخرى"]}
        submitLabel="تأكيد الإفراج"
        destructive
        onSubmit={async (p) => { await forceRelease.mutateAsync({ id: escrow.id, reason: p.details || p.reason }); }}
      />

      {/* Dispute */}
      <ReasonDialog
        open={disputeOpen}
        onOpenChange={setDisputeOpen}
        title="فتح نزاع"
        reasons={DISPUTE_REASONS}
        minDetails={20}
        destructive
        submitLabel="فتح النزاع"
        successTitle="تم فتح النزاع"
        successMessage="سيتم مراجعة النزاع خلال 24 ساعة"
        onSubmit={async (p) => { await openDispute.mutateAsync({ id: escrow.id, reason: p.reason, description: p.details }); }}
      />

      {/* Refund */}
      <ReasonDialog
        open={refundOpen}
        onOpenChange={setRefundOpen}
        title="طلب استرداد المبلغ"
        reasons={REFUND_REASONS}
        minDetails={15}
        submitLabel="إرسال الطلب"
        onSubmit={async (p) => { await requestRefund.mutateAsync({ id: escrow.id, reason: `${p.reason} — ${p.details}` }); }}
      />

      {/* Admin refund */}
      <ReasonDialog
        open={adminRefundOpen}
        onOpenChange={setAdminRefundOpen}
        title="استرداد إجباري"
        reasons={["قرار لصالح المشتري", "توقف الصفقة", "أخرى"]}
        destructive
        submitLabel="تنفيذ الاسترداد"
        onSubmit={async (p) => { await forceRefund.mutateAsync({ id: escrow.id, reason: p.details || p.reason }); }}
      />

      {/* Resolve dispute */}
      <ReasonDialog
        open={resolveOpen}
        onOpenChange={setResolveOpen}
        title="قرار النزاع"
        reasons={["حل لصالح المشتري (استرداد)", "حل لصالح المعرض (إفراج)", "رفض النزاع", "قيد المراجعة"]}
        submitLabel="حفظ القرار"
        onSubmit={async (p) => {
          if (p.reason.includes("استرداد")) {
            await forceRefund.mutateAsync({ id: escrow.id, reason: p.details });
          } else if (p.reason.includes("إفراج")) {
            await forceRelease.mutateAsync({ id: escrow.id, reason: p.details });
          } else if (p.reason.includes("رفض")) {
            await resolveDispute.mutateAsync({ id: escrow.id, status: "rejected", resolution: p.details });
          } else {
            await resolveDispute.mutateAsync({ id: escrow.id, status: "under_review", resolution: p.details });
          }
        }}
      />
    </>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-2.5">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-sm font-medium mt-0.5">{value}</div>
    </div>
  );
}

const STAGE_LABEL: Record<EscrowStatus, string> = {
  pending_payment: "الدفع",
  paid: "مدفوع",
  purchased: "الشراء",
  shipping: "الشحن",
  delivered: "التسليم",
  awaiting_confirmation: "التأكيد",
  released: "الإفراج",
  refunded: "مسترد",
  disputed: "نزاع",
};

// Local Scale icon usage
function Scale({ className }: { className?: string }) {
  return <ShieldCheck className={className} />;
}
