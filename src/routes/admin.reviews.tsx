import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/reviews/star-rating";
import { ReviewViewDialog } from "@/components/reviews/review-view-dialog";
import { useReviews, useSetReviewStatus } from "@/hooks/reviews";
import { formatDate } from "@/services/mock-data";
import { Eye, EyeOff, Flag, RotateCcw } from "lucide-react";
import type { Review } from "@/services/reviews-data";

export const Route = createFileRoute("/admin/reviews")({ component: AdminReviewsPage });

function AdminReviewsPage() {
  const { data = [] } = useReviews();
  const setStatus = useSetReviewStatus();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<string>("all");
  const [vis, setVis] = useState<string>("all");
  const [open, setOpen] = useState<Review | null>(null);

  const rows = useMemo(() => {
    return data.filter((r) => {
      if (role !== "all" && r.revieweeRole !== role) return false;
      if (vis !== "all" && r.status !== vis) return false;
      if (q) {
        const hay = `${r.reviewerName} ${r.revieweeName} ${r.escrowId} ${r.comment} ${r.vehicle ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [data, q, role, vis]);

  return (
    <DashboardLayout title="التقييمات">
      <div className="flex flex-wrap gap-2 mb-3">
        <Input className="flex-1 min-w-[220px]" placeholder="بحث بالاسم أو رقم الضمان أو التعليق..." value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأدوار (المُقَيَّم)</SelectItem>
            <SelectItem value="agency">تقييمات المعارض</SelectItem>
            <SelectItem value="user">تقييمات المشترين</SelectItem>
          </SelectContent>
        </Select>
        <Select value={vis} onValueChange={setVis}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="visible">ظاهرة</SelectItem>
            <SelectItem value="hidden">مخفية</SelectItem>
            <SelectItem value="reported">مُبلَّغ عنها</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs">
                <tr>
                  <th className="p-3 text-start">المُقيِّم</th>
                  <th className="p-3 text-start">دور المُقيِّم</th>
                  <th className="p-3 text-start">الطرف المُقَيَّم</th>
                  <th className="p-3 text-start">دور المُقَيَّم</th>
                  <th className="p-3 text-start">التقييم</th>
                  <th className="p-3 text-start">التعليق</th>
                  <th className="p-3 text-start">الضمان</th>
                  <th className="p-3 text-start">التاريخ</th>
                  <th className="p-3 text-start">الحالة</th>
                  <th className="p-3 text-start">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t align-top hover:bg-muted/20 cursor-pointer" onClick={() => setOpen(r)}>
                    <td className="p-3 font-medium">{r.reviewerName}</td>
                    <td className="p-3 text-xs text-muted-foreground">{r.reviewerRole === "agency" ? "معرض" : "مشتري"}</td>
                    <td className="p-3 font-medium">{r.revieweeName}</td>
                    <td className="p-3 text-xs text-muted-foreground">{r.revieweeRole === "agency" ? "معرض" : "مشتري"}</td>
                    <td className="p-3"><StarRating value={r.rating} readOnly size={14} /></td>
                    <td className="p-3 max-w-[260px] text-muted-foreground truncate">{r.comment || <span className="italic">—</span>}</td>
                    <td className="p-3 font-mono text-xs">{r.escrowId}</td>
                    <td className="p-3 text-muted-foreground whitespace-nowrap">{formatDate(r.createdAt)}</td>
                    <td className="p-3">
                      {r.status === "hidden" && <Badge variant="secondary">مخفية</Badge>}
                      {r.status === "reported" && <Badge variant="destructive">مُبلَّغ</Badge>}
                      {r.status === "visible" && <Badge>ظاهرة</Badge>}
                    </td>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap gap-1">
                        {r.status !== "visible" && (
                          <Button size="sm" variant="outline" disabled={setStatus.isPending}
                            onClick={() => setStatus.mutate({ id: r.id, status: "visible" })}>
                            <RotateCcw className="ml-1 size-3.5" /> استعادة
                          </Button>
                        )}
                        {r.status !== "hidden" && (
                          <Button size="sm" variant="outline" disabled={setStatus.isPending}
                            onClick={() => setStatus.mutate({ id: r.id, status: "hidden" })}>
                            {r.status === "visible"
                              ? <><EyeOff className="ml-1 size-3.5" /> إخفاء</>
                              : <><Eye className="ml-1 size-3.5" /> إخفاء</>}
                          </Button>
                        )}
                        {r.status !== "reported" && (
                          <Button size="sm" variant="outline" disabled={setStatus.isPending}
                            onClick={() => setStatus.mutate({ id: r.id, status: "reported" })}>
                            <Flag className="ml-1 size-3.5" /> إبلاغ
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={10} className="p-10 text-center text-muted-foreground">لا توجد تقييمات مطابقة</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ReviewViewDialog open={!!open} onOpenChange={(o) => !o && setOpen(null)} review={open} />
    </DashboardLayout>
  );
}
