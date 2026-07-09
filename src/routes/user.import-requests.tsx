import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Ship, Search, MoreVertical, Copy, Edit, Trash2, Eye, Package } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useImportRequestsV2, useDuplicateImportRequest, useCancelImportRequest } from "@/hooks/import-requests";
import { useAuthStore } from "@/store/auth";
import { STATUS_LABELS_AR, STATUS_VARIANTS, type ImportRequest, type ImportStatus } from "@/services/import-data";
import { formatDate } from "@/services/mock-data";
import { useMoney } from "@/lib/format";
import { ImportRequestWizard } from "@/components/import/request-wizard";
import { RequestDetailsDialog } from "@/components/import/request-details-dialog";
import { OffersSheet } from "@/components/import/offers-sheet";
import { ConfirmDialog } from "@/components/flow";
import { useAllOffers } from "@/hooks/import-requests";

export const Route = createFileRoute("/user/import-requests")({ component: ImportRequests });

function ImportRequests() {
  const money = useMoney();
  const auth = useAuthStore();
  const { data, isLoading } = useImportRequestsV2();
  const { data: allOffers } = useAllOffers();
  const duplicate = useDuplicateImportRequest();
  const cancel = useCancelImportRequest();

  const [wizardOpen, setWizardOpen] = useState(false);
  const [editing, setEditing] = useState<ImportRequest | null>(null);
  const [detail, setDetail] = useState<ImportRequest | null>(null);
  const [offersFor, setOffersFor] = useState<ImportRequest | null>(null);
  const [cancelTarget, setCancelTarget] = useState<ImportRequest | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ImportStatus | "all">("all");

  const mine = useMemo(() => {
    const list = data ?? [];
    // Show requests owned by this user + the first 4 seeded (so demo isn't empty)
    const owned = list.filter((r) => r.requesterId === auth.phone);
    const seed = list.filter((r) => r.requesterId !== auth.phone).slice(0, 4);
    return [...owned, ...seed];
  }, [data, auth.phone]);

  const offerCount = (id: string) => (allOffers ?? []).filter((o) => o.requestId === id).length;

  const filtered = mine.filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    if (q && !`${r.brand} ${r.model} ${r.id}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: mine.length,
    open: mine.filter((r) => r.status === "open" || r.status === "bidding").length,
    accepted: mine.filter((r) => r.status === "accepted").length,
    cancelled: mine.filter((r) => r.status === "cancelled").length,
  };

  return (
    <DashboardLayout title="طلبات الاستيراد">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard label="إجمالي الطلبات" value={stats.total} />
        <StatCard label="نشط" value={stats.open} />
        <StatCard label="مقبول" value={stats.accepted} />
        <StatCard label="ملغي" value={stats.cancelled} />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="بحث..." value={q} onChange={(e) => setQ(e.target.value)} className="pr-8" />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as ImportStatus | "all")}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              {(Object.keys(STATUS_LABELS_AR) as ImportStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABELS_AR[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { setEditing(null); setWizardOpen(true); }}>
          <Plus className="ml-2 size-4" /> طلب استيراد جديد
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Ship className="mx-auto size-12 text-muted-foreground mb-3" />
          <p className="font-semibold">لا توجد طلبات بعد</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">أنشئ طلب استيراد وسنقوم بإشعار المعارض المعتمدة.</p>
          <Button onClick={() => { setEditing(null); setWizardOpen(true); }}>
            <Plus className="ml-2 size-4" /> إنشاء طلب
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((r) => {
            const isOwn = r.requesterId === auth.phone;
            return (
              <Card key={r.id} className="hover:shadow-md transition">
                <CardHeader className="flex-row items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="font-display flex items-center gap-2">
                      <Ship className="size-5 text-primary" /> {r.brand} {r.model} {r.year}
                    </CardTitle>
                    <div className="text-xs text-muted-foreground mt-1">{r.id} • من {r.fromCountry} • {formatDate(r.createdAt)}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={STATUS_VARIANTS[r.status]}>{STATUS_LABELS_AR[r.status]}</Badge>
                    {isOwn && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="size-7"><MoreVertical className="size-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDetail(r)}><Eye className="ml-2 size-4" /> عرض التفاصيل</DropdownMenuItem>
                          {r.status === "open" && (
                            <DropdownMenuItem onClick={() => { setEditing(r); setWizardOpen(true); }}>
                              <Edit className="ml-2 size-4" /> تعديل
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => duplicate.mutate(r.id)}>
                            <Copy className="ml-2 size-4" /> تكرار
                          </DropdownMenuItem>
                          {(r.status === "open" || r.status === "bidding") && (
                            <DropdownMenuItem className="text-destructive" onClick={() => setCancelTarget(r)}>
                              <Trash2 className="ml-2 size-4" /> إلغاء الطلب
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <Info label="الميزانية" value={money(r.budget)} />
                    <Info label="الاستلام" value={r.destination} />
                    <Info label="العروض" value={String(offerCount(r.id))} />
                    <Info label="آخر تحديث" value={formatDate(r.updatedAt)} />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setDetail(r)}>التفاصيل</Button>
                    <Button size="sm" className="flex-1" onClick={() => setOffersFor(r)}>
                      <Package className="ml-1 size-3.5" /> العروض ({offerCount(r.id)})
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ImportRequestWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        editing={editing}
      />

      <RequestDetailsDialog
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
        request={detail}
        role="user"
        onViewOffers={() => { if (detail) { setOffersFor(detail); setDetail(null); } }}
        onEdit={() => { if (detail) { setEditing(detail); setDetail(null); setWizardOpen(true); } }}
        onDuplicate={() => { if (detail) { duplicate.mutate(detail.id); setDetail(null); } }}
        onCancel={() => { if (detail) { setCancelTarget(detail); setDetail(null); } }}
      />

      <OffersSheet
        request={offersFor}
        open={!!offersFor}
        onOpenChange={(o) => !o && setOffersFor(null)}
        role="user"
      />

      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(o) => !o && setCancelTarget(null)}
        title="تأكيد إلغاء الطلب"
        description={cancelTarget ? `سيتم إلغاء طلب ${cancelTarget.brand} ${cancelTarget.model} ورفض جميع العروض المعلقة. لا يمكن التراجع.` : ""}
        confirmLabel="إلغاء الطلب"
        destructive
        onConfirm={async () => {
          if (!cancelTarget) return;
          await cancel.mutateAsync({ id: cancelTarget.id });
          setCancelTarget(null);
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold font-display mt-1">{value}</div>
    </div>
  );
}
