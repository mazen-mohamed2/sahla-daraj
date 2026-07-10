import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/reviews/star-rating";
import { useReviews, useToggleReviewVisibility } from "@/hooks/reviews";
import { formatDate } from "@/services/mock-data";
import { Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/admin/reviews")({ component: AdminReviewsPage });

function AdminReviewsPage() {
  const { data = [] } = useReviews();
  const toggle = useToggleReviewVisibility();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<string>("all");
  const [vis, setVis] = useState<string>("all");

  const rows = useMemo(() => {
    return data.filter((r) => {
      if (role !== "all" && r.revieweeRole !== role) return false;
      if (vis !== "all" && r.status !== vis) return false;
      if (q) {
        const hay = `${r.reviewerName} ${r.revieweeName} ${r.escrowId} ${r.comment}`.toLowerCase();
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
            <SelectItem value="all">كل الأدوار</SelectItem>
            <SelectItem value="agency">تقييمات المعارض</SelectItem>
            <SelectItem value="user">تقييمات المشترين</SelectItem>
          </SelectContent>
        </Select>
        <Select value={vis} onValueChange={setVis}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="visible">ظاهرة</SelectItem>
            <SelectItem value="hidden">مخفية</SelectItem>
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
                  <th className="p-3 text-start">الطرف المُقَيَّم</th>
                  <th className="p-3 text-start">الضمان</th>
                  <th className="p-3 text-start">التقييم</th>
                  <th className="p-3 text-start">التعليق</th>
                  <th className="p-3 text-start">التاريخ</th>
                  <th className="p-3 text-start">الحالة</th>
                  <th className="p-3 text-start">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t align-top">
                    <td className="p-3">
                      <div className="font-medium">{r.reviewerName}</div>
                      <div className="text-xs text-muted-foreground">{r.reviewerRole === "agency" ? "معرض" : "مشتري"}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{r.revieweeName}</div>
                      <div className="text-xs text-muted-foreground">{r.revieweeRole === "agency" ? "معرض" : "مشتري"}</div>
                    </td>
                    <td className="p-3 font-mono text-xs">{r.escrowId}</td>
                    <td className="p-3"><StarRating value={r.rating} readOnly size={14} /></td>
                    <td className="p-3 max-w-[280px] text-muted-foreground">{r.comment || <span className="italic">—</span>}</td>
                    <td className="p-3 text-muted-foreground whitespace-nowrap">{formatDate(r.createdAt)}</td>
                    <td className="p-3">
                      {r.status === "hidden"
                        ? <Badge variant="secondary">مخفية</Badge>
                        : <Badge>ظاهرة</Badge>}
                    </td>
                    <td className="p-3">
                      <Button size="sm" variant="outline" disabled={toggle.isPending}
                        onClick={() => toggle.mutate({ id: r.id, hidden: r.status !== "hidden" })}
                      >
                        {r.status === "hidden"
                          ? <><Eye className="ml-1 size-4" /> إظهار</>
                          : <><EyeOff className="ml-1 size-4" /> إخفاء</>}
                      </Button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={8} className="p-10 text-center text-muted-foreground">لا توجد تقييمات مطابقة</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
