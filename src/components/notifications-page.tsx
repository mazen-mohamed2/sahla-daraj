import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, Bell, Trash2, Check, MailOpen, ArrowDownAZ, ArrowUpAZ, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationDialog } from "@/components/notification-dialog";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuthStore, type Role } from "@/store/auth";
import { useUIStore } from "@/store/ui";
import { cn } from "@/lib/utils";
import {
  useNotifications,
  type AppNotification,
  type NotifCategory,
  CATEGORY_LABELS_AR,
  CATEGORY_LABELS_EN,
  formatRelative,
} from "@/store/notifications";

const PAGE_SIZE = 15;

export function NotificationsPage({ role: forcedRole }: { role?: Role }) {
  const authRole = useAuthStore((s) => s.role);
  const role = forcedRole ?? authRole;
  const lang = useUIStore((s) => s.lang);
  const feed = useNotifications((s) => s.feeds[role]);
  const { markRead, markUnread, markAllRead, remove, clear } = useNotifications();
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [category, setCategory] = useState<NotifCategory | "all">("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AppNotification | null>(null);
  const [loading] = useState(false);

  const catLabels = lang === "ar" ? CATEGORY_LABELS_AR : CATEGORY_LABELS_EN;

  const filtered = useMemo(() => {
    let list = [...feed];
    if (q) {
      const s = q.toLowerCase();
      list = list.filter((n) => n.title.toLowerCase().includes(s) || n.message.toLowerCase().includes(s));
    }
    if (category !== "all") list = list.filter((n) => n.category === category);
    if (unreadOnly) list = list.filter((n) => !n.read);
    list.sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sort === "newest" ? db - da : da - db;
    });
    return list;
  }, [feed, q, category, unreadOnly, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const unreadCount = feed.filter((n) => !n.read).length;

  return (
    <DashboardLayout title={lang === "ar" ? "الإشعارات" : "Notifications"}>
      <div className="space-y-4 max-w-5xl">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className={`absolute ${lang === "ar" ? "right-3" : "left-3"} top-1/2 size-4 -translate-y-1/2 text-muted-foreground`} />
                <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder={lang === "ar" ? "بحث..." : "Search..."} className={lang === "ar" ? "pr-9" : "pl-9"} />
              </div>
              <Select value={category} onValueChange={(v) => { setCategory(v as NotifCategory | "all"); setPage(1); }}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{lang === "ar" ? "كل الفئات" : "All categories"}</SelectItem>
                  {(Object.keys(catLabels) as NotifCategory[]).map((c) => (
                    <SelectItem key={c} value={c}>{catLabels[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant={unreadOnly ? "default" : "outline"} size="sm" onClick={() => { setUnreadOnly((v) => !v); setPage(1); }}>
                {lang === "ar" ? "غير المقروء" : "Unread"} {unreadCount > 0 && <Badge variant="secondary" className="ms-2">{unreadCount}</Badge>}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSort(sort === "newest" ? "oldest" : "newest")}>
                {sort === "newest" ? <ArrowDownAZ className="size-4 me-1" /> : <ArrowUpAZ className="size-4 me-1" />}
                {sort === "newest" ? (lang === "ar" ? "الأحدث" : "Newest") : (lang === "ar" ? "الأقدم" : "Oldest")}
              </Button>
              <div className="flex-1" />
              <Button variant="ghost" size="sm" onClick={() => markAllRead(role)} disabled={unreadCount === 0}>
                <Check className="size-4 me-1" /> {lang === "ar" ? "تحديد الكل كمقروء" : "Mark all read"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { if (confirm(lang === "ar" ? "مسح كل الإشعارات؟" : "Clear all notifications?")) clear(role); }} disabled={feed.length === 0}>
                <Trash2 className="size-4 me-1" /> {lang === "ar" ? "مسح الكل" : "Clear all"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4 flex gap-3"><Skeleton className="size-10 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-full" /></div></CardContent></Card>
            ))}
          </div>
        ) : paged.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Bell className="size-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm text-muted-foreground">{lang === "ar" ? "لا توجد إشعارات مطابقة" : "No matching notifications"}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {paged.map((n) => (
              <Card key={n.id} className={cn("group transition-colors", !n.read && "border-primary/40 bg-primary/5")}>
                <CardContent className="p-4 flex gap-3 items-start">
                  <button onClick={() => setSelected(n)} className="flex-1 text-start min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant="secondary" className="text-[10px]">{catLabels[n.category]}</Badge>
                      {n.priority === "high" && <Badge variant="destructive" className="text-[10px]">{lang === "ar" ? "عاجل" : "High"}</Badge>}
                      {!n.read && <span className="size-2 rounded-full bg-primary" />}
                    </div>
                    <p className="font-medium leading-snug">{n.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatRelative(n.createdAt, lang)}</p>
                  </button>
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {n.actionUrl && (
                      <Button variant="ghost" size="icon" onClick={() => { if (!n.read) markRead(role, n.id); navigate({ to: n.actionUrl! }); }} aria-label="open">
                        <ExternalLink className="size-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => (n.read ? markUnread(role, n.id) : markRead(role, n.id))} aria-label="toggle read">
                      {n.read ? <MailOpen className="size-4" /> : <Check className="size-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(role, n.id)} aria-label="delete">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {pageCount > 1 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">
                  {lang === "ar" ? `صفحة ${page} من ${pageCount}` : `Page ${page} of ${pageCount}`}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    {lang === "ar" ? "السابق" : "Prev"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount}>
                    {lang === "ar" ? "التالي" : "Next"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <NotificationDialog notification={selected} onOpenChange={(o) => !o && setSelected(null)} />
    </DashboardLayout>
  );
}
