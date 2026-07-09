import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  STATUS_LABELS_AR, STATUS_VARIANTS, CONDITION_LABELS, DELIVERY_PREF_LABELS,
  type ImportRequest,
} from "@/services/import-data";
import { useOffers } from "@/hooks/import-requests";
import { formatDate } from "@/services/mock-data";
import { useMoney } from "@/lib/format";
import { Link } from "@tanstack/react-router";
import { Car, MapPin, Calendar, Package, ShieldAlert, ExternalLink } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  request: ImportRequest | null;
  onViewOffers?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  onDuplicate?: () => void;
  role?: "user" | "agency" | "admin";
}

export function RequestDetailsDialog({ open, onOpenChange, request, onViewOffers, onEdit, onCancel, onDuplicate, role = "user" }: Props) {
  const money = useMoney();
  const { data: offers } = useOffers(request?.id);
  if (!request) return null;
  const canEdit = role === "user" && request.status === "open";
  const canCancel = role === "user" && (request.status === "open" || request.status === "bidding");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Car className="size-5 text-primary" />
            {request.brand} {request.model} {request.year}
            <Badge variant={STATUS_VARIANTS[request.status]} className="mr-auto">
              {STATUS_LABELS_AR[request.status]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {request.flagReason && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm flex gap-2">
              <ShieldAlert className="size-4 text-destructive shrink-0 mt-0.5" />
              <div><strong>مبلغ عنه:</strong> {request.flagReason}</div>
            </div>
          )}

          <section>
            <h4 className="font-semibold mb-2">بيانات السيارة</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Info label="الحالة" value={CONDITION_LABELS[request.condition]} />
              <Info label="الممشى" value={`${request.mileage.toLocaleString("ar-EG")} كم`} />
              <Info label="الوقود" value={request.fuel} />
              <Info label="ناقل الحركة" value={request.transmission} />
            </div>
          </section>

          <Separator />
          <section>
            <h4 className="font-semibold mb-2">المتطلبات</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Info label="الميزانية" value={money(request.budget)} strong />
              <Info label="اللون" value={request.color} />
            </div>
            {request.notes && (
              <div className="mt-2 rounded-lg bg-muted/40 p-3 text-sm">{request.notes}</div>
            )}
          </section>

          <Separator />
          <section>
            <h4 className="font-semibold mb-2">الشحن والتسليم</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Info label="مدينة الاستلام" value={request.destination} icon={MapPin} />
              <Info label="الأولوية" value={DELIVERY_PREF_LABELS[request.deliveryPreference]} />
              <Info label="بلد المصدر" value={request.fromCountry ?? "غير محدد"} />
              <Info label="عدد العروض" value={String(offers?.length ?? 0)} />
            </div>
          </section>

          <Separator />
          <section>
            <h4 className="font-semibold mb-2 flex items-center gap-2"><Calendar className="size-4" /> الجدول الزمني</h4>
            <ol className="relative border-r-2 border-border pr-4 space-y-3">
              {request.timeline.map((t) => (
                <li key={t.id} className="relative">
                  <span className="absolute -right-[22px] top-1 size-3 rounded-full bg-primary" />
                  <div className="text-sm">{t.message}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(t.at)} {t.actor && `• ${t.actor}`}</div>
                </li>
              ))}
            </ol>
          </section>

          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>أنشئ: {formatDate(request.createdAt)}</div>
            <div>آخر تحديث: {formatDate(request.updatedAt)}</div>
          </div>

          {role === "admin" && request.adminNotes && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
              <div className="text-xs font-semibold mb-1">ملاحظات إدارية</div>
              {request.adminNotes}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <Button onClick={onViewOffers}>
              <Package className="ml-1 size-4" /> عرض العروض ({offers?.length ?? 0})
            </Button>
            {canEdit && <Button variant="outline" onClick={onEdit}>تعديل</Button>}
            {role === "user" && <Button variant="outline" onClick={onDuplicate}>تكرار</Button>}
            {canCancel && <Button variant="destructive" onClick={onCancel}>إلغاء الطلب</Button>}
            {request.escrowId && (
              <Button variant="outline" asChild>
                <Link to="/user/escrow"><ExternalLink className="ml-1 size-4" /> الضمان {request.escrowId}</Link>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value, strong, icon: Icon }: { label: string; value: string; strong?: boolean; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-lg border p-2">
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        {Icon && <Icon className="size-3" />}
        {label}
      </div>
      <div className={strong ? "font-bold" : "font-medium"}>{value}</div>
    </div>
  );
}
