import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useImportRequestsV2, useAllOffers, useWithdrawOffer } from "@/hooks/import-requests";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/services/mock-data";
import { useMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Gavel, Edit, X, Search, Package, Eye } from "lucide-react";
import { STATUS_LABELS_AR, STATUS_VARIANTS, OFFER_STATUS_LABELS_AR, type ImportRequest, type Offer } from "@/services/import-data";
import { useAuthStore } from "@/store/auth";
import { OfferDialog } from "@/components/import/offer-dialog";
import { RequestDetailsDialog } from "@/components/import/request-details-dialog";
import { ConfirmDialog } from "@/components/flow";

export const Route = createFileRoute("/agency/bids")({ component: Bids });

function Bids() {
  const money = useMoney();
  const auth = useAuthStore();
  const { data: requests, isLoading } = useImportRequestsV2();
  const { data: offers } = useAllOffers();
  const withdraw = useWithdrawOffer();

  const [country, setCountry] = useState("all");
  const [q, setQ] = useState("");
  const [offerTarget, setOfferTarget] = useState<{ request: ImportRequest; editing?: Offer | null } | null>(null);
  const [detail, setDetail] = useState<ImportRequest | null>(null);
  const [withdrawTarget, setWithdrawTarget] = useState<Offer | null>(null);

  const myOfferByReq = useMemo(() => {
    const map = new Map<string, Offer>();
    (offers ?? []).forEach((o) => { if (o.agencyId === auth.phone) map.set(o.requestId, o); });
    return map;
  }, [offers, auth.phone]);

  const openRequests = (requests ?? []).filter((r) => (r.status === "open" || r.status === "bidding") && !r.hidden);
  const countries = Array.from(new Set(openRequests.map((r) => r.fromCountry).filter(Boolean))) as string[];

  const filtered = openRequests.filter((r) => {
    if (country !== "all" && r.fromCountry !== country) return false;
    if (q && !`${r.brand} ${r.model} ${r.destination}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const offerCount = (id: string) => (offers ?? []).filter((o) => o.requestId === id && o.status === "pending").length;


  return (
    <DashboardLayout title="طلبات الاستيراد المتاحة">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="بحث في الطلبات..." value={q} onChange={(e) => setQ(e.target.value)} className="pr-8" />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm">البلد:</Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Package className="mx-auto size-12 text-muted-foreground mb-3" />
          <p className="font-semibold">لا توجد طلبات مطابقة</p>
          <p className="text-sm text-muted-foreground mt-1">جرّب تعديل التصفية.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((r) => {
            const my = myOfferByReq.get(r.id);
            return (
              <Card key={r.id}>
                <CardHeader className="flex-row items-start justify-between gap-2">
                  <div>
                    <CardTitle className="font-display">{r.brand} {r.model} {r.year}</CardTitle>
                    <div className="text-xs text-muted-foreground mt-1">من {r.fromCountry} • {r.requester} • {formatDate(r.createdAt)}</div>
                  </div>
                  <Badge variant={STATUS_VARIANTS[r.status]}>{STATUS_LABELS_AR[r.status]}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Info label="الميزانية" value={money(r.budget)} />
                    <Info label="الاستلام" value={r.destination} />
                    <Info label="الموعد النهائي" value={formatDate(r.deadline)} />
                    <Info label="العروض" value={String(offerCount(r.id))} />
                  </div>

                  {my ? (
                    <div className="rounded-lg border p-2 text-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">عرضك الحالي</span>
                        <Badge variant={my.status === "accepted" ? "default" : my.status === "rejected" ? "destructive" : "secondary"}>
                          {OFFER_STATUS_LABELS_AR[my.status]}
                        </Badge>
                      </div>
                      <div className="flex justify-between"><span>السعر</span><span className="font-bold">{money(my.price)}</span></div>
                      {my.status === "pending" && (
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => setOfferTarget({ request: r, editing: my })}>
                            <Edit className="ml-1 size-3.5" /> تعديل
                          </Button>
                          <Button size="sm" variant="destructive" className="flex-1" onClick={() => setWithdrawTarget(my)}>
                            <X className="ml-1 size-3.5" /> سحب العرض
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setDetail(r)}>
                        <Eye className="ml-1 size-3.5" /> التفاصيل
                      </Button>
                      <Button size="sm" className="flex-1" onClick={() => setOfferTarget({ request: r })}>
                        <Gavel className="ml-1 size-3.5" /> تقديم عرض
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <OfferDialog
        open={!!offerTarget}
        onOpenChange={(o) => !o && setOfferTarget(null)}
        request={offerTarget?.request ?? null}
        editing={offerTarget?.editing ?? null}
      />

      <RequestDetailsDialog
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
        request={detail}
        role="agency"
        onViewOffers={() => { if (detail) { setOfferTarget({ request: detail }); setDetail(null); } }}
      />

      <ConfirmDialog
        open={!!withdrawTarget}
        onOpenChange={(o) => !o && setWithdrawTarget(null)}
        title="تأكيد سحب العرض"
        description="سيتم حذف عرضك نهائياً من هذا الطلب."
        confirmLabel="سحب العرض"
        destructive
        onConfirm={async () => {
          if (!withdrawTarget) return;
          await withdraw.mutateAsync(withdrawTarget.id);
          setWithdrawTarget(null);
        }}
      />
    </DashboardLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
