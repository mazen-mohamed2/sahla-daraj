import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/reviews/star-rating";
import { ReviewViewDialog } from "@/components/reviews/review-view-dialog";
import { useEscrows } from "@/hooks/escrows";
import { useReceivedReviews, useGivenReviews } from "@/hooks/reviews";
import { formatDate } from "@/services/mock-data";
import type { Review } from "@/services/reviews-data";
import { Star, MessageSquare, CheckCircle2 } from "lucide-react";

interface Props {
  role: "user" | "agency";
  title: string;
}

/** Shared reviews-and-reputation page. Rendered by both /user/reviews and /agency/reviews. */
export function ReviewsPage({ role, title }: Props) {
  const { data: escrows = [] } = useEscrows();
  const escrowIds = useMemo(() => escrows.map((e) => e.id), [escrows]);
  const received = useReceivedReviews(escrowIds, role);
  const given = useGivenReviews(escrowIds, role);
  const [selected, setSelected] = useState<Review | null>(null);

  const completedDeals = useMemo(
    () => escrows.filter((e) => e.status === "released").length,
    [escrows],
  );

  // Reputation is computed only from RECEIVED, VISIBLE reviews.
  const visibleReceived = received.filter((r) => r.status === "visible");
  const total = visibleReceived.length;
  const avg = total ? visibleReceived.reduce((s, r) => s + r.rating, 0) / total : 0;
  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of visibleReceived) {
    const k = Math.max(1, Math.min(5, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    distribution[k]++;
  }

  const otherRoleLabel = role === "user" ? "المعرض" : "المشتري";

  return (
    <DashboardLayout title={title}>
      {/* Summary */}
      <div className="grid gap-3 lg:grid-cols-[1fr_1.4fr] mb-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Stat icon={Star} label="متوسط التقييم" value={total ? avg.toFixed(1) : "—"} />
              <Stat icon={MessageSquare} label="عدد التقييمات" value={String(total)} />
              <Stat icon={CheckCircle2} label="صفقات مكتملة" value={String(completedDeals)} />
            </div>
            <StarRating value={avg} readOnly />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-muted-foreground mb-2">توزيع التقييمات</div>
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((n) => {
                const c = distribution[n as 1 | 2 | 3 | 4 | 5];
                const pct = total ? Math.round((c / total) * 100) : 0;
                return (
                  <div key={n} className="flex items-center gap-2 text-xs">
                    <span className="w-6 text-muted-foreground">{n}★</span>
                    <div className="flex-1 h-2 rounded bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-10 text-end text-muted-foreground">{c}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="received">
        <TabsList className="grid grid-cols-2 w-full max-w-sm">
          <TabsTrigger value="received">التقييمات المستلمة ({received.length})</TabsTrigger>
          <TabsTrigger value="given">التقييمات التي كتبتها ({given.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="pt-3">
          <ReviewsTable
            rows={received}
            emptyText={`لم يقيّمك أي ${otherRoleLabel} بعد`}
            partyLabel="المُقيِّم"
            partyGetter={(r) => ({ name: r.reviewerName, role: r.reviewerRole })}
            onOpen={setSelected}
          />
        </TabsContent>
        <TabsContent value="given" className="pt-3">
          <ReviewsTable
            rows={given}
            emptyText="لم تكتب أي تقييمات بعد"
            partyLabel="الطرف المُقَيَّم"
            partyGetter={(r) => ({ name: r.revieweeName, role: r.revieweeRole })}
            onOpen={setSelected}
          />
        </TabsContent>
      </Tabs>

      <ReviewViewDialog
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        review={selected}
        viewerRole={role}
      />
    </DashboardLayout>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Star; label: string; value: string }) {
  return (
    <div className="rounded-lg border p-2 text-center">
      <Icon className="size-4 mx-auto text-primary" />
      <div className="text-lg font-bold mt-1">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function ReviewsTable({
  rows,
  emptyText,
  partyLabel,
  partyGetter,
  onOpen,
}: {
  rows: Review[];
  emptyText: string;
  partyLabel: string;
  partyGetter: (r: Review) => { name: string; role: "user" | "agency" };
  onOpen: (r: Review) => void;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs">
              <tr>
                <th className="p-3 text-start">{partyLabel}</th>
                <th className="p-3 text-start">التقييم</th>
                <th className="p-3 text-start">التعليق</th>
                <th className="p-3 text-start">السيارة</th>
                <th className="p-3 text-start">الضمان</th>
                <th className="p-3 text-start">التاريخ</th>
                <th className="p-3 text-start">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const p = partyGetter(r);
                return (
                  <tr
                    key={r.id}
                    className="border-t align-top hover:bg-muted/20 cursor-pointer"
                    onClick={() => onOpen(r)}
                  >
                    <td className="p-3">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.role === "agency" ? "معرض" : "مشتري"}
                      </div>
                    </td>
                    <td className="p-3"><StarRating value={r.rating} readOnly size={13} /></td>
                    <td className="p-3 max-w-[320px] text-muted-foreground truncate">
                      {r.comment || <span className="italic">—</span>}
                    </td>
                    <td className="p-3">{r.vehicle ?? <span className="text-muted-foreground">—</span>}</td>
                    <td className="p-3 font-mono text-xs">{r.escrowId}</td>
                    <td className="p-3 text-muted-foreground whitespace-nowrap">{formatDate(r.createdAt)}</td>
                    <td className="p-3">
                      {r.status === "hidden" && <Badge variant="secondary">مخفي</Badge>}
                      {r.status === "reported" && <Badge variant="destructive">مُبلَّغ</Badge>}
                      {r.status === "visible" && <Badge>ظاهر</Badge>}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-muted-foreground">{emptyText}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
