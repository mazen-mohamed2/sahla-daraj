import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Eye, Flag, Lock, Unlock, EyeOff, StickyNote, Package, Ship, Clock, Users } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useImportRequestsV2, useAllOffers, useAdminSetRequestStatus, useAdminAddNote, useAuditLog, useAdminToggleHidden, useAdminToggleReported } from "@/hooks/import-requests";
import { STATUS_LABELS_AR, STATUS_VARIANTS, type ImportRequest, type ImportStatus } from "@/services/import-data";
import { formatDate } from "@/services/mock-data";
import { useMoney } from "@/lib/format";
import { RequestDetailsDialog } from "@/components/import/request-details-dialog";
import { OffersSheet } from "@/components/import/offers-sheet";
import { ReasonDialog, ConfirmDialog } from "@/components/flow";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { KpiCard } from "@/components/kpi-card";

export const Route = createFileRoute("/admin/import-requests")({ component: AdminImportRequests });

type SortKey = "newest" | "offers" | "budget";

function AdminImportRequests() {
  const money = useMoney();
  const { data, isLoading } = useImportRequestsV2();
  const { data: offers } = useAllOffers();
  const { data: audit } = useAuditLog();
  const setStatus = useAdminSetRequestStatus();
  const addNote = useAdminAddNote();
  const toggleHidden = useAdminToggleHidden();
  const toggleReported = useAdminToggleReported();


  const [q, setQ] = useState("");
  const [status, setStatus_, ] = useState<ImportStatus | "all">("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [detail, setDetail] = useState<ImportRequest | null>(null);
  const [offersFor, setOffersFor] = useState<ImportRequest | null>(null);
  const [flagTarget, setFlagTarget] = useState<ImportRequest | null>(null);
  const [closeTarget, setCloseTarget] = useState<ImportRequest | null>(null);
  const [noteTarget, setNoteTarget] = useState<ImportRequest | null>(null);
  const [note, setNote] = useState("");

  const offersByReq = useMemo(() => {
    const m = new Map<string, number>();
    (offers ?? []).forEach((o) => {
      if (o.status === "pending" || o.status === "accepted") {
        m.set(o.requestId, (m.get(o.requestId) ?? 0) + 1);
      }
    });
    return m;
  }, [offers]);


  const stats = useMemo(() => {
    const list = data ?? [];
    const open = list.filter((r) => r.status === "open" || r.status === "bidding").length;
    const closed = list.filter((r) => r.status === "closed" || r.status === "accepted").length;
    const cancelled = list.filter((r) => r.status === "cancelled").length;
    const totalOffers = (offers ?? []).length;
    const avgOffers = list.length ? (totalOffers / list.length).toFixed(1) : "0";
    const brandCount = new Map<string, number>();
    list.forEach((r) => brandCount.set(r.brand, (brandCount.get(r.brand) ?? 0) + 1));
    const topBrand = [...brandCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    const agencyCount = new Map<string, number>();
    (offers ?? []).forEach((o) => agencyCount.set(o.agencyName, (agencyCount.get(o.agencyName) ?? 0) + 1));
    const topAgency = [...agencyCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    return { open, closed, cancelled, avgOffers, topBrand, topAgency };
  }, [data, offers]);

  const filtered = useMemo(() => {
    let list = [...(data ?? [])];
    if (status !== "all") list = list.filter((r) => r.status === status);
    if (q) list = list.filter((r) => `${r.brand} ${r.model} ${r.id} ${r.requester}`.toLowerCase().includes(q.toLowerCase()));
    if (sort === "newest") list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (sort === "offers") list.sort((a, b) => (offersByReq.get(b.id) ?? 0) - (offersByReq.get(a.id) ?? 0));
    if (sort === "budget") list.sort((a, b) => b.budget - a.budget);
    return list;
  }, [data, status, q, sort, offersByReq]);

  return (
    <DashboardLayout title="طلبات الاستيراد — الإدارة">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard title="طلبات مفتوحة" value={String(stats.open)} icon={Ship} tone="primary" />
        <KpiCard title="طلبات مغلقة" value={String(stats.closed)} icon={Lock} tone="success" />
        <KpiCard title="ملغاة" value={String(stats.cancelled)} icon={EyeOff} tone="warning" />
        <KpiCard title="متوسط العروض" value={stats.avgOffers} icon={Package} tone="primary" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <Card><CardContent className="p-4 flex items-center justify-between">
          <div><div className="text-xs text-muted-foreground">الماركة الأكثر طلباً</div><div className="font-display text-xl mt-1">{stats.topBrand}</div></div>
          <Users className="size-8 text-muted-foreground" />
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center justify-between">
          <div><div className="text-xs text-muted-foreground">أنشط معرض</div><div className="font-display text-xl mt-1">{stats.topAgency}</div></div>
          <Clock className="size-8 text-muted-foreground" />
        </CardContent></Card>
      </div>

      <Card className="mb-4">
        <CardHeader><CardTitle className="text-base">تصفية</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-56">
            <Search className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="بحث..." value={q} onChange={(e) => setQ(e.target.value)} className="pr-8" />
          </div>
          <Select value={status} onValueChange={(v) => setStatus_(v as ImportStatus | "all")}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              {(Object.keys(STATUS_LABELS_AR) as ImportStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABELS_AR[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">الأحدث</SelectItem>
              <SelectItem value="offers">الأكثر عروضاً</SelectItem>
              <SelectItem value="budget">الأعلى ميزانية</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="font-semibold">لا توجد طلبات مطابقة</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-start">
                <th className="p-3 text-start">الطلب</th>
                <th className="p-3 text-start">العميل</th>
                <th className="p-3 text-start">الميزانية</th>
                <th className="p-3 text-start">العروض</th>
                <th className="p-3 text-start">الحالة</th>
                <th className="p-3 text-start">التاريخ</th>
                <th className="p-3 text-start">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t hover:bg-muted/30">
                  <td className="p-3">
                    <div className="font-medium">{r.brand} {r.model} {r.year}</div>
                    <div className="text-xs text-muted-foreground">{r.id} • {r.destination}</div>
                  </td>
                  <td className="p-3">{r.requester}</td>
                  <td className="p-3 font-semibold">{money(r.budget)}</td>
                  <td className="p-3">{offersByReq.get(r.id) ?? 0}</td>
                  <td className="p-3"><Badge variant={STATUS_VARIANTS[r.status]}>{STATUS_LABELS_AR[r.status]}</Badge></td>
                  <td className="p-3 text-xs">{formatDate(r.createdAt)}</td>
                  <td className="p-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline">إجراءات</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setDetail(r)}><Eye className="ml-2 size-4" /> عرض</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setOffersFor(r)}><Package className="ml-2 size-4" /> العروض</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {r.status !== "closed" && (
                          <DropdownMenuItem onClick={() => setCloseTarget(r)}><Lock className="ml-2 size-4" /> إغلاق الطلب</DropdownMenuItem>
                        )}
                        {(r.status === "closed" || r.status === "cancelled" || r.status === "hidden") && (
                          <DropdownMenuItem onClick={() => setStatus.mutate({ id: r.id, status: "open" })}>
                            <Unlock className="ml-2 size-4" /> إعادة فتح
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => setFlagTarget(r)}><Flag className="ml-2 size-4" /> إبلاغ</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatus.mutate({ id: r.id, status: "hidden" })}>
                          <EyeOff className="ml-2 size-4" /> إخفاء
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setNoteTarget(r); setNote(r.adminNotes); }}>
                          <StickyNote className="ml-2 size-4" /> ملاحظات
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Card className="mt-4">
        <CardHeader><CardTitle className="text-base">سجل التدقيق (آخر 10)</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1 max-h-56 overflow-y-auto">
          {(audit ?? []).length === 0 && <div className="text-muted-foreground">لا توجد إدخالات</div>}
          {(audit ?? []).slice(0, 10).map((a) => (
            <div key={a.id} className="flex items-center justify-between border-b py-1">
              <span>{a.actor} • {a.action} • {a.targetId}</span>
              <span className="text-xs text-muted-foreground">{formatDate(a.at)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <RequestDetailsDialog
        open={!!detail} onOpenChange={(o) => !o && setDetail(null)}
        request={detail} role="admin"
        onViewOffers={() => { if (detail) { setOffersFor(detail); setDetail(null); } }}
      />
      <OffersSheet request={offersFor} open={!!offersFor} onOpenChange={(o) => !o && setOffersFor(null)} role="admin" />

      <ConfirmDialog
        open={!!closeTarget} onOpenChange={(o) => !o && setCloseTarget(null)}
        title="إغلاق الطلب"
        description={closeTarget ? `سيتم إغلاق طلب ${closeTarget.id} ومنع تقديم عروض جديدة.` : ""}
        confirmLabel="إغلاق"
        destructive
        onConfirm={async () => {
          if (!closeTarget) return;
          await setStatus.mutateAsync({ id: closeTarget.id, status: "closed" });
          setCloseTarget(null);
        }}
      />

      <ReasonDialog
        open={!!flagTarget}
        onOpenChange={(o) => !o && setFlagTarget(null)}
        title="الإبلاغ عن الطلب"
        reasons={["محتوى مضلل", "احتيال محتمل", "سعر غير واقعي", "مخالفة الشروط", "سبب آخر"]}
        submitLabel="تأكيد الإبلاغ"
        destructive
        onSubmit={async ({ reason, details }) => {
          if (!flagTarget) return;
          await setStatus.mutateAsync({ id: flagTarget.id, status: "flagged", reason: `${reason} — ${details}` });
          setFlagTarget(null);
        }}
      />

      <Dialog open={!!noteTarget} onOpenChange={(o) => !o && setNoteTarget(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>ملاحظات إدارية — {noteTarget?.id}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>الملاحظة</Label>
            <Textarea rows={5} value={note} onChange={(e) => setNote(e.target.value)} placeholder="ملاحظات داخلية غير مرئية للعميل..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteTarget(null)}>إلغاء</Button>
            <Button onClick={async () => {
              if (!noteTarget) return;
              await addNote.mutateAsync({ id: noteTarget.id, note });
              setNoteTarget(null);
            }}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
