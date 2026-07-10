import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Package, MessageCircle, Building2, Check, X } from "lucide-react";
import { useMoney } from "@/lib/format";
import { formatDate } from "@/services/mock-data";
import { OFFER_STATUS_LABELS_AR, type ImportRequest, type Offer } from "@/services/import-data";
import { useOffers, useAcceptOffer, useRejectOffer } from "@/hooks/import-requests";
import { ConfirmDialog, ReasonDialog } from "@/components/flow";
import { Skeleton } from "@/components/ui/skeleton";
import { StartChatButton } from "@/components/chat/start-chat-button";

type SortKey = "price" | "delivery" | "rating" | "newest";

interface Props {
  request: ImportRequest | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  role?: "user" | "admin";
}

const deliveryOrder = ["أسبوع", "أسبوعين", "شهر", "شهرين", "3 أشهر"];

export function OffersSheet({ request, open, onOpenChange, role = "user" }: Props) {
  const money = useMoney();
  const { data: offers, isLoading } = useOffers(request?.id);
  const accept = useAcceptOffer();
  const reject = useRejectOffer();
  const [sort, setSort] = useState<SortKey>("price");
  const [acceptTarget, setAcceptTarget] = useState<Offer | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Offer | null>(null);

  const canAct = role === "user" && request?.status !== "accepted" && request?.status !== "cancelled" && request?.status !== "closed";

  const sorted = [...(offers ?? [])].sort((a, b) => {
    if (sort === "price") return a.price + a.shippingCost - (b.price + b.shippingCost);
    if (sort === "delivery") return deliveryOrder.indexOf(a.delivery) - deliveryOrder.indexOf(b.delivery);
    if (sort === "rating") return b.agencyRating - a.agencyRating;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-full sm:max-w-xl overflow-y-auto" dir="rtl">
          <SheetHeader>
            <SheetTitle className="font-display">
              العروض على {request ? `${request.brand} ${request.model} ${request.year}` : ""}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-4 flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">{sorted.length} عرض</span>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="price">الأقل سعراً</SelectItem>
                <SelectItem value="delivery">الأسرع تسليماً</SelectItem>
                <SelectItem value="rating">الأعلى تقييماً</SelectItem>
                <SelectItem value="newest">الأحدث</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 space-y-3">
            {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
            {!isLoading && sorted.length === 0 && (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <Package className="mx-auto size-10 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">لا توجد عروض بعد</p>
                <p className="text-xs text-muted-foreground mt-1">سيتم إشعارك فور وصول أول عرض</p>
              </div>
            )}
            {sorted.map((o) => (
              <div key={o.id} className="rounded-xl border p-4 space-y-3 hover:shadow-sm transition">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 font-semibold">
                      <Building2 className="size-4 text-primary" />
                      {o.agencyName}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Star className="size-3 text-amber-500" /> {o.agencyRating}</span>
                      <span>{o.completedDeals} صفقة</span>
                      <span>{formatDate(o.createdAt)}</span>
                    </div>
                  </div>
                  <Badge variant={o.status === "accepted" ? "default" : o.status === "rejected" ? "destructive" : "secondary"}>
                    {OFFER_STATUS_LABELS_AR[o.status]}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><div className="text-xs text-muted-foreground">السعر</div><div className="font-bold">{money(o.price)}</div></div>
                  <div><div className="text-xs text-muted-foreground">الشحن</div><div className="font-bold">{money(o.shippingCost)}</div></div>
                  <div><div className="text-xs text-muted-foreground">التسليم</div><div>{o.delivery}</div></div>
                  <div><div className="text-xs text-muted-foreground">الضمان</div><div>{o.warranty}</div></div>
                </div>
                {o.notes && <p className="text-sm rounded bg-muted/40 p-2">{o.notes}</p>}
                <div className="flex flex-wrap gap-2">
                  <StartChatButton
                    peer={{ id: `agency:${o.agencyId}`, name: o.agencyName, role: "agency", avatarColor: "#059669" }}
                    related={{ kind: "offer", id: o.id, label: `عرض على ${request?.brand} ${request?.model}`, meta: { price: o.price, requestId: o.requestId } }}
                    label="محادثة"
                  />
                  {canAct && o.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => setAcceptTarget(o)}>
                        <Check className="ml-1 size-3.5" /> قبول العرض
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setRejectTarget(o)}>
                        <X className="ml-1 size-3.5" /> رفض
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!acceptTarget}
        onOpenChange={(o) => !o && setAcceptTarget(null)}
        title="تأكيد قبول العرض"
        description={acceptTarget ? `سيتم قبول عرض ${acceptTarget.agencyName} بقيمة ${money(acceptTarget.price)}، ورفض باقي العروض تلقائياً، وسيتم إنشاء ضمان (Escrow) بقيمة ${money(acceptTarget.price + acceptTarget.shippingCost)}.` : ""}
        confirmLabel="قبول وإنشاء الضمان"
        onConfirm={async () => {
          if (!acceptTarget || !request) return;
          await accept.mutateAsync({ offerId: acceptTarget.id, requestId: request.id });
          setAcceptTarget(null);
        }}
      />

      <ReasonDialog
        open={!!rejectTarget}
        onOpenChange={(o) => !o && setRejectTarget(null)}
        title="رفض العرض"
        reasons={["السعر مرتفع", "مدة التسليم طويلة", "المواصفات غير مطابقة", "الضمان غير مناسب", "سبب آخر"]}
        submitLabel="تأكيد الرفض"
        destructive
        onSubmit={async ({ reason, details }) => {
          if (!rejectTarget) return;
          await reject.mutateAsync({ offerId: rejectTarget.id, reason: `${reason} — ${details}` });
          setRejectTarget(null);
        }}
      />
    </>
  );
}
